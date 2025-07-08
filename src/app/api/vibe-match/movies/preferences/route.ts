import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/mongodb';
import { verifyAuthToken } from '@/lib/auth';
import { ObjectId } from 'mongodb';

interface UserProfile {
  _id: ObjectId;
  user_id: number;
  name: string;
  dob: string;
  gender: string;
  profile_picture?: string;
  liked_movies?: string[];
  disliked_movies?: string[];
  favorite_genres?: string[];
  completed_onboarding: boolean;
}

interface MatchResult {
  user_id: number;
  name: string;
  age: number;
  gender: string;
  profile_picture?: string;
  match_percentage: number;
  shared_movies: string[];
  shared_genres: string[];
}

// Handle POST request to save user's movie preferences and find matches
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

    // Connect to the database
    const client = await connectToDatabase();
    const db = client.db('teledriveDB');
    const profilesCollection = db.collection('vibeMatchProfiles');
    const moviesCollection = db.collection('movies');

    // Get the user's current profile with their liked/disliked movies
    const userProfile = await profilesCollection.findOne({ user_id: user.user_id });
    
    if (!userProfile) {
      return NextResponse.json({ 
        success: false, 
        message: 'User profile not found' 
      }, { status: 404 });
    }

    const likedMovies = userProfile.liked_movies || [];
    const dislikedMovies = userProfile.disliked_movies || [];

    // If user hasn't liked any movies, we can't calculate preferences
    if (likedMovies.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No liked movies found to calculate preferences' 
      }, { status: 400 });
    }

    // Get movie genre information for liked movies
    const likedMovieObjects = await moviesCollection
      .find({ _id: { $in: likedMovies.map((id: string) => new ObjectId(id)) } })
      .project({ genres: 1 })
      .toArray();

    // Calculate genre preferences
    const genreCounts: Record<string, number> = {};
    
    likedMovieObjects.forEach(movie => {
      if (Array.isArray(movie.genres)) {
        movie.genres.forEach((genre: string) => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });
    
    // Sort genres by count to get top preferences
    const favoriteGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([genre]) => genre);

    // Update user's profile with calculated genre preferences
    await profilesCollection.updateOne(
      { user_id: user.user_id },
      { 
        $set: { 
          favorite_genres: favoriteGenres,
          movie_preferences_completed: true,
          movie_preferences_completed_at: new Date(),
          updated_at: new Date()
        } 
      }
    );

    // Find potential matches based on movie and genre preferences
    // We want users with at least one liked movie in common or similar genres
    const potentialMatches = await profilesCollection.find({
      user_id: { $ne: user.user_id }, // Not the current user
      $or: [
        { liked_movies: { $in: likedMovies } }, // At least one liked movie in common
        { favorite_genres: { $in: favoriteGenres } } // At least one genre in common
      ]
    }).toArray();

    const matches: MatchResult[] = [];
    
    // Calculate match scores for each potential match
    for (const potentialMatch of potentialMatches) {
      const matchLikedMovies = potentialMatch.liked_movies || [];
      const matchFavoriteGenres = potentialMatch.favorite_genres || [];
      
      // Find shared movies
      const sharedMovies = likedMovies.filter((movieId: string) => 
        matchLikedMovies.includes(movieId)
      );
      
      // Find shared genres
      const sharedGenres = favoriteGenres.filter(genre => 
        matchFavoriteGenres.includes(genre)
      );
      
      // Calculate match percentage (50% weight on movies, 50% on genres)
      let movieScore = 0;
      if (likedMovies.length > 0 && matchLikedMovies.length > 0) {
        movieScore = (sharedMovies.length / Math.max(likedMovies.length, matchLikedMovies.length)) * 100;
      }
      
      let genreScore = 0;
      if (favoriteGenres.length > 0 && matchFavoriteGenres.length > 0) {
        genreScore = (sharedGenres.length / Math.max(favoriteGenres.length, matchFavoriteGenres.length)) * 100;
      }
      
      const matchPercentage = Math.round((movieScore * 0.5) + (genreScore * 0.5));

      // Only include matches above a certain threshold (e.g., 20%)
      if (matchPercentage >= 20) {
        // Calculate age from DOB
        const dob = new Date(potentialMatch.dob);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        
        matches.push({
          user_id: potentialMatch.user_id,
          name: potentialMatch.name,
          age,
          gender: potentialMatch.gender,
          profile_picture: potentialMatch.profile_picture,
          match_percentage: matchPercentage,
          shared_movies: sharedMovies,
          shared_genres: sharedGenres
        });
      }
    }
    
    // Sort matches by match percentage (highest first)
    matches.sort((a, b) => b.match_percentage - a.match_percentage);
    
    // Take top matches
    const topMatches = matches.slice(0, 10);
    
    // If we have matches, update user's profile with match status
    const hasMatches = topMatches.length > 0;
    
    await profilesCollection.updateOne(
      { user_id: user.user_id },
      { 
        $set: { 
          has_matches: hasMatches,
          last_match_check: new Date(),
          needs_more_swipes: !hasMatches, // Flag to indicate if user needs more swipes
          updated_at: new Date()
        } 
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Preferences saved successfully',
      favorite_genres: favoriteGenres,
      has_matches: hasMatches,
      matches: topMatches
    });
  } catch (error) {
    console.error('Error saving preferences:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 