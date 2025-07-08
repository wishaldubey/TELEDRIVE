import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { verifyAuthToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

// Handle GET request to fetch random movies for swiping
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

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Connect to the database
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const moviesCollection = db.collection('movies');
    const swipesCollection = db.collection('vibeMatchSwipes');

    // Get movies the user has already swiped on
    const swipedMovies = await swipesCollection
      .find({ user_id: user.user_id })
      .toArray();
    
    const swipedMovieIds = swipedMovies.map(swipe => swipe.movie_id);

    // Get random movies that haven't been swiped yet
    const pipeline = [
      // Filter out movies the user has already swiped on
      {
        $match: {
          _id: { $nin: swipedMovieIds.map(id => new ObjectId(id)) },
          poster_url: { $exists: true, $ne: null } // Ensure movies have posters
        }
      },
      // Get random sample
      { $sample: { size: limit } },
      // Project only needed fields
      {
        $project: {
          _id: 1,
          title: 1,
          poster_url: 1,
          genres: 1
        }
      }
    ];

    const movies = await moviesCollection.aggregate(pipeline).toArray();

    // Convert MongoDB ObjectId to string for serialization
    const formattedMovies = movies.map(movie => ({
      ...movie,
      _id: (movie._id as ObjectId).toString(),
    }));

    return NextResponse.json({
      success: true,
      movies: formattedMovies
    });
  } catch (error) {
    console.error('Error fetching movies for swiping:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 