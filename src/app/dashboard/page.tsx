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
    <div className="flex flex-col min-h-screen bg-black text-white">
      <DashboardHeader user={user as AppUser} />
      
      {/* Hero Section - Featured/Recently Uploaded File */}
      {files.length > 0 && (
        <div className="pt-16 w-full">
          <div className="relative h-[50vh] w-full">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black z-10"></div>
            
            {/* Featured file background */}
            <div 
              className="absolute inset-0 bg-cover bg-center" 
              style={{ 
                backgroundColor: '#111',
                backgroundImage: files[0].thumb_file_id ? `url(/api/thumbnail/${files[0].file_id})` : undefined,
                filter: 'brightness(0.5) saturate(1.2) blur(1px)'
              }}
            ></div>
            
            {/* Content */}
            <div className="absolute bottom-0 left-0 z-20 p-8 w-full md:w-2/3 lg:w-1/2">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm bg-red-600/80 px-2 py-1 rounded">RECENT</span>
                <span className="text-sm text-gray-300">{new Date(files[0].date).toLocaleDateString()}</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4 line-clamp-2">
                {files[0].caption || files[0].file_name || `File_${files[0].file_id.substring(0, 8)}`}
              </h1>
              
              <p className="text-gray-300 mb-6 line-clamp-2">
                {files[0].file_type} • {files[0].file_size ? (files[0].file_size / 1024 / 1024).toFixed(2) + ' MB' : 'Unknown size'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-1 container mx-auto px-4 py-6 md:py-8 max-w-7xl relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Your Files</h2>
          <div className="text-gray-400">
            Total: <span className="text-white font-medium">{totalFiles}</span> file{totalFiles !== 1 ? 's' : ''}
          </div>
        </div>
        
        <Suspense fallback={
          <div className="flex justify-center items-center py-16">
            <div className="animate-pulse flex space-x-4">
              <div className="rounded-full bg-gray-700 h-12 w-12"></div>
              <div className="flex-1 space-y-4 py-1">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        }>
          {files.length > 0 ? (
            <FileGrid files={files} totalFiles={totalFiles} currentPage={currentPage} />
          ) : (
            <div className="text-center py-16 bg-gray-900/40 rounded-xl border border-gray-800">
              <h3 className="text-2xl font-medium mb-4">No files found</h3>
              <p className="text-gray-400 mb-6">Start uploading files to your Telegram channel and they'll appear here.</p>
            </div>
          )}
        </Suspense>
      </main>
    </div>
  );
} 