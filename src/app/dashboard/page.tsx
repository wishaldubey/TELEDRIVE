import { Suspense } from 'react';
import { cookies } from 'next/headers';
import { verifyAuthToken } from '@/lib/auth';
import { connectToDatabase } from '@/lib/db/mongodb';
import { AppUser, FileData } from '@/types';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import FileGrid from '@/components/files/FileGrid';
import { ObjectId } from 'mongodb';

// Maximum number of files to fetch per page
const ITEMS_PER_PAGE = 20;

async function getUserFiles(userId: number, page: number = 1): Promise<{ files: FileData[], totalFiles: number }> {
  try {
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const filesCollection = db.collection('files');
    
    // Get total count for pagination
    const totalFiles = await filesCollection.countDocuments({ owner_id: userId });
    
    // Calculate skip value based on page number
    const skip = (page - 1) * ITEMS_PER_PAGE;
    
    // Fetch files with pagination
    const files = await filesCollection
      .find({ owner_id: userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(ITEMS_PER_PAGE)
      .toArray();
    
    // Convert MongoDB ObjectId to string for serialization
    return {
      files: files.map((file) => ({
        ...file,
        _id: (file._id as ObjectId).toString(),
      })) as FileData[],
      totalFiles
    };
  } catch (error) {
    console.error('Error fetching files:', error);
    return { files: [], totalFiles: 0 };
  }
}

export default async function DashboardPage({ 
  searchParams 
}: { 
  searchParams?: { page?: string } 
}) {
  // Get current page from search params or default to page 1
  const pageParam = searchParams?.page;
  const currentPage = pageParam ? parseInt(pageParam, 10) || 1 : 1;
  
  // Get the current user from the auth token
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) {
    throw new Error('Authentication required');
  }
  
  const user = await verifyAuthToken(token);
  if (!user) {
    throw new Error('Invalid authentication token');
  }
  
  // Fetch the user's files with pagination
  const { files, totalFiles } = await getUserFiles(user.user_id, currentPage);

  return (
    <div className="flex flex-col min-h-screen bg-background relative">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 -right-20 w-[500px] h-[500px] bg-cyan/10 rounded-full filter blur-[80px] opacity-40"></div>
        <div className="absolute bottom-0 -left-20 w-[500px] h-[500px] bg-primary/10 rounded-full filter blur-[80px] opacity-40"></div>
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 w-[300px] h-[300px] bg-pink/10 rounded-full filter blur-[80px] opacity-20"></div>
      </div>
      
      <DashboardHeader user={user as AppUser} />
      
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-7xl relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <h1 className="text-2xl font-bold gradient-text-primary">Your Files</h1>
          <div className="text-sm bg-card/30 px-4 py-2 rounded-full border border-border/50 shadow-sm backdrop-blur-sm">
            Total: <span className="text-primary font-medium">{totalFiles}</span> file{totalFiles !== 1 ? 's' : ''}
          </div>
        </div>
        
        <Suspense fallback={
          <div className="flex justify-center items-center py-16">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-card h-12 w-12"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-card rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-card rounded"></div>
                  <div className="h-4 bg-card rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        }>
          <div className="bg-card/20 backdrop-blur-sm rounded-xl border border-border/40 p-5 shadow-lg">
            <FileGrid files={files} totalFiles={totalFiles} currentPage={currentPage} />
          </div>
        </Suspense>
      </main>
    </div>
  );
} 