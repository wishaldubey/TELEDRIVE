import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { ObjectId } from 'mongodb';

export async function GET() {
  try {
    // Get user from token
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const user = await verifyAuthToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    
    const userId = user.user_id;
    
    // Get files from MongoDB
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const filesCollection = db.collection('files');
    
    const files = await filesCollection.find({ owner_id: userId }).sort({ date: -1 }).toArray();
    
    // Convert MongoDB ObjectIds to strings for JSON serialization
    const serializedFiles = files.map(file => ({
      ...file,
      _id: (file._id as ObjectId).toString()
    }));
    
    return NextResponse.json(serializedFiles);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
} 