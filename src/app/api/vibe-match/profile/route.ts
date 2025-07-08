import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { verifyAuthToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Handle GET request to fetch user's vibe match profile
export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    // Verify auth token
    const user = await verifyAuthToken(token);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid authentication token' }, { status: 401 });
    }

    // Connect to the database
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const profilesCollection = db.collection('vibeMatchProfiles');

    // Find the user's profile
    const profile = await profilesCollection.findOne({ user_id: user.user_id });

    if (!profile) {
      return NextResponse.json({ success: false, message: 'Profile not found' }, { status: 404 });
    }

    // Convert MongoDB ObjectId to string for serialization
    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        _id: (profile._id as ObjectId).toString(),
      }
    });
  } catch (error) {
    console.error('Error fetching profile:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// Handle POST request to create/update user's vibe match profile
export async function POST(request: NextRequest) {
  try {
    // Get auth token from cookies
    const token = request.cookies.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 });
    }

    // Verify auth token
    const user = await verifyAuthToken(token);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Invalid authentication token' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const dob = formData.get('dob') as string;
    const gender = formData.get('gender') as string;
    const bio = formData.get('bio') as string;
    const profilePicture = formData.get('profile_picture') as File | null;
    const favoriteGenres = formData.getAll('favorite_genres') as string[];

    // Validate required fields
    if (!name || !dob || !gender) {
      return NextResponse.json({ 
        success: false, 
        message: 'Name, date of birth, and gender are required' 
      }, { status: 400 });
    }

    // Connect to the database
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const profilesCollection = db.collection('vibeMatchProfiles');

    // Check if profile already exists
    const existingProfile = await profilesCollection.findOne({ user_id: user.user_id });
    
    // Prepare profile data
    const profileData: any = {
      user_id: user.user_id,
      name,
      dob,
      gender,
      completed_onboarding: true,
      updated_at: new Date(),
    };
    
    // Add optional fields if present
    if (bio) profileData.bio = bio;
    if (favoriteGenres.length > 0) profileData.favorite_genres = favoriteGenres;
    
    // Upload profile picture to Telegram if provided
    if (profilePicture) {
      const telegramFileId = await uploadProfilePictureToTelegram(profilePicture);
      profileData.profile_picture = telegramFileId;
    }

    let result;
    if (existingProfile) {
      // Update existing profile, preserving fields that weren't in the form data
      result = await profilesCollection.updateOne(
        { user_id: user.user_id },
        { 
          $set: profileData,
          // Preserve profile_picture if not updated
          $setOnInsert: !profilePicture && existingProfile.profile_picture ? 
            { profile_picture: existingProfile.profile_picture } : {}
        }
      );
    } else {
      // Create new profile
      profileData.created_at = new Date();
      result = await profilesCollection.insertOne(profileData);
    }

    if (!result.acknowledged) {
      throw new Error('Failed to save profile');
    }

    // Get the updated/created profile
    const updatedProfile = await profilesCollection.findOne({ user_id: user.user_id });
    
    return NextResponse.json({
      success: true,
      profile: {
        ...updatedProfile,
        _id: (updatedProfile?._id as ObjectId).toString(),
      }
    });
  } catch (error) {
    console.error('Error creating/updating profile:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// Function to upload profile picture to Telegram
async function uploadProfilePictureToTelegram(file: File): Promise<string> {
  try {
    // Convert File to Buffer for Telegram API
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Hardcoded channel ID where profile pictures will be stored
    const channelId = process.env.TELEGRAM_PROFILE_PICS_CHANNEL || '-1002515160546';
    
    // Use your bot token from environment variables
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error('Telegram bot token not configured');
    }

    // Create form data for the Telegram API
    const formData = new FormData();
    formData.append('chat_id', channelId);
    
    // Create a new file with proper name
    const fileName = `profile_${Date.now()}.jpg`;
    const fileBlob = new Blob([buffer], { type: file.type });
    formData.append('photo', fileBlob, fileName);
    
    // Send the photo to Telegram
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description}`);
    }
    
    // Get the file_id from the response
    const fileId = data.result.photo[data.result.photo.length - 1].file_id;
    
    return fileId;
  } catch (error) {
    console.error('Error uploading profile picture to Telegram:', error);
    throw error;
  }
} 