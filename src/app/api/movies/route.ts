import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import axios from "axios";

// Hardcoded TMDB API key as requested
const TMDB_API_KEY = '4df8ee28bee18d23050955334c22877e';

export async function GET(req: NextRequest) {
  try {
    // Connect to MongoDB and get database client
    const client = await connectToDatabase();
    const db = client.db("teledriveDB"); // Changed from "teledrive" to "teledriveDB" to match the bot's database
    
    // Get query parameters
    const url = new URL(req.url);
    const searchQuery = url.searchParams.get("search") || "";
    const genre = url.searchParams.get("genre") || "";
    const year = url.searchParams.get("year") || "";
    const sortBy = url.searchParams.get("sort") || "date"; // Default sort by date
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    
    // Build query
    const query: any = {};
    
    if (searchQuery) {
      // Improved search with better text matching for various formats
      try {
        // Normalize search query - remove punctuation, convert to lowercase, normalize spaces
        const normalizedSearch = searchQuery.toLowerCase()
          .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")  // Remove punctuation
          .replace(/\s+/g, "")                          // Remove ALL spaces for comparison
          .trim();
        
        // Create a version with spaces completely removed to match titles regardless of spacing
        const noSpaceSearch = searchQuery.toLowerCase().replace(/\s+/g, "");
        
        // Create a flexible regex pattern that makes spaces optional between characters
        // This will match cases like "8 A M" when searching for "8am"
        let flexiblePattern = "";
        for (let i = 0; i < normalizedSearch.length; i++) {
          flexiblePattern += normalizedSearch[i] + "\\s*";
        }
        // Remove the trailing \s*
        flexiblePattern = flexiblePattern.slice(0, -3);
        
        // Create multiple search conditions to find the movie in different ways
        const searchConditions: any[] = [
          // Original query with case insensitivity
          { title: { $regex: searchQuery, $options: "i" } },
          
          // Flexible pattern that makes spaces optional between each character
          { title: { $regex: flexiblePattern, $options: "i" } },
          
          // Match on a normalized version (no spaces) of the title field
          // Using a simpler approach that will work with MongoDB
          { title: { $regex: noSpaceSearch.split("").join("\\s*"), $options: "i" } }
        ];
        
        // Original words-based approach for longer queries
        if (normalizedSearch.length > 3) {
          const searchWords = searchQuery.toLowerCase()
            .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
            .split(/\s+/)
            .filter(word => word.length > 1);
            
          if (searchWords.length > 1) {
            // For multi-word searches
            const phraseRegex = searchWords.join("\\s*");
            const wordConditions = searchWords.map(word => ({
              title: { $regex: word, $options: "i" }
            }));
            
            searchConditions.push(
              { title: { $regex: phraseRegex, $options: "i" } },
              { $and: wordConditions }
            );
          }
        }
        
        // Combine all search approaches with OR
        query.$or = searchConditions;
        
        console.log("Advanced search query:", JSON.stringify(query));
      } catch (error) {
        console.error("Error with advanced search:", error);
        // Fallback to simple search
        query.title = { $regex: searchQuery, $options: "i" };
      }
    }
    
    if (genre) {
      // Make genre matching more reliable - convert to lowercase for consistency
      const normalizedGenre = genre.toLowerCase();
      query.genres = { 
        $elemMatch: { 
          $regex: new RegExp(normalizedGenre, "i")
        } 
      };
    }
    
    if (year) {
      query.release_year = parseInt(year);
    }
    
    console.log("MongoDB Query:", JSON.stringify(query));
    console.log("Sort by:", sortBy);
    
    // Get total count for pagination
    const totalCount = await db.collection("movies").countDocuments(query);
    console.log("Total movies matching query:", totalCount);
    
    // Determine sort order
    let sortOrder: any = {};
    switch (sortBy) {
      case "title":
        sortOrder = { title: 1 };
        break;
      case "popular":
        sortOrder = { vote_average: -1 };
        break;
      case "year":
        sortOrder = { release_year: -1 };
        break;
      case "date":
      default:
        // Use uploaded_at instead of added_date since that's what the bot uses
        sortOrder = { uploaded_at: -1 };
        break;
    }
    
    // Get movies with pagination and sorting
    const movies = await db
      .collection("movies")
      .find(query)
      .sort(sortOrder)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
      
    console.log(`Found ${movies.length} movies`);
    if (movies.length > 0) {
      console.log("First movie:", movies[0].title);
    }
      
    // Get all unique genres for filtering
    const genres = await db
      .collection("movies")
      .distinct("genres");
      
    // Get all unique years for filtering
    const years = await db
      .collection("movies")
      .distinct("release_year");
      
    // If movies don't have poster URLs and we have the TMDB API key, try to fetch them
    for (const movie of movies) {
      if (!movie.poster_url && movie.title) {
        try {
          // Search for the movie on TMDB
          const searchResponse = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
            params: {
              api_key: TMDB_API_KEY,
              query: movie.title,
              year: movie.release_year
            }
          });

          if (searchResponse.data.results && searchResponse.data.results.length > 0) {
            const posterPath = searchResponse.data.results[0].poster_path;
            if (posterPath) {
              movie.poster_url = `https://image.tmdb.org/t/p/w500${posterPath}`;
              
              // Update the movie in the database with the poster URL
              await db.collection("movies").updateOne(
                { _id: movie._id },
                { $set: { poster_url: movie.poster_url } }
              );
            }
          }
        } catch (error) {
          console.error(`Error fetching TMDB data for movie ${movie.title}:`, error);
        }
      }
    }

    return NextResponse.json({
      movies,
      genres: genres.filter(g => g), // Filter out null/undefined values
      years: years.filter(y => y).sort((a, b) => b - a), // Sort years in descending order
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching movies:", error);
    return NextResponse.json(
      { error: "Failed to fetch movies" },
      { status: 500 }
    );
  }
} 