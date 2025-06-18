import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import axios from "axios";

// Hardcoded TMDB API key as requested
const TMDB_API_KEY = '4df8ee28bee18d23050955334c22877e';

export async function GET(
  req: NextRequest,
  { params }: { params: { movieId: string } }
) {
  try {
    // Connect to MongoDB and get database client
    const client = await connectToDatabase();
    const db = client.db("teledriveDB"); // Changed from "teledrive" to "teledriveDB" to match the bot's database
    
    const movieId = params.movieId;

    // Find the movie by ID
    const movie = await db.collection("movies").findOne({
      _id: new ObjectId(movieId),
    });

    if (!movie) {
      console.error(`Movie not found with ID: ${movieId}`);
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    console.log(`Found movie: ${movie.title}`);

    // If the movie has a poster URL from TMDB, use that
    if (movie.poster_url) {
      try {
        console.log(`Using poster URL: ${movie.poster_url}`);
        const response = await axios.get(movie.poster_url, {
          responseType: "arraybuffer",
          timeout: 5000 // 5 second timeout
        });
        
        const buffer = Buffer.from(response.data, "binary");
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "image/jpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      } catch (error) {
        console.error("Error fetching poster URL:", error);
        // Continue to next method if this fails
      }
    }

    // If the movie has a Telegram thumbnail, use it
    if (movie.thumb_file_id) {
      try {
        console.log(`Using Telegram thumbnail: ${movie.thumb_file_id}`);
        // Fetch the file path from Telegram
        const telegramBotToken = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '8069923631:AAFuNciS0sd8WzCCH-Zx-acdd9l3rt5O3FA';
        const filePathResponse = await axios.get(
          `https://api.telegram.org/bot${telegramBotToken}/getFile?file_id=${movie.thumb_file_id}`,
          { timeout: 5000 }
        );

        if (filePathResponse.data.ok) {
          const filePath = filePathResponse.data.result.file_path;
          const fileUrl = `https://api.telegram.org/file/bot${telegramBotToken}/${filePath}`;

          // Download the file
          const fileResponse = await axios.get(fileUrl, {
            responseType: "arraybuffer",
            timeout: 5000
          });

          const buffer = Buffer.from(fileResponse.data, "binary");
          return new NextResponse(buffer, {
            headers: {
              "Content-Type": "image/jpeg",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }
      } catch (error) {
        console.error("Error fetching Telegram thumbnail:", error);
        // Continue to next method if this fails
      }
    }

    // If no movie poster is available, try to fetch it from TMDB using the movie title
    if (movie.title) {
      try {
        console.log(`Searching TMDB for poster for: ${movie.title}`);
        // Search for the movie on TMDB
        const searchResponse = await axios.get(`https://api.themoviedb.org/3/search/movie`, {
          params: {
            api_key: TMDB_API_KEY,
            query: movie.title,
            year: movie.release_year
          },
          timeout: 5000
        });

        if (searchResponse.data.results && searchResponse.data.results.length > 0) {
          const posterPath = searchResponse.data.results[0].poster_path;
          if (posterPath) {
            const posterUrl = `https://image.tmdb.org/t/p/w500${posterPath}`;
            console.log(`Found TMDB poster: ${posterUrl}`);
            
            try {
              // Get the poster image
              const posterResponse = await axios.get(posterUrl, {
                responseType: "arraybuffer",
                timeout: 5000
              });
              
              const buffer = Buffer.from(posterResponse.data, "binary");
              
              // Store this URL in the database for future use
              await db.collection("movies").updateOne(
                { _id: new ObjectId(movieId) },
                { $set: { poster_url: posterUrl } }
              );
              
              return new NextResponse(buffer, {
                headers: {
                  "Content-Type": "image/jpeg",
                  "Cache-Control": "public, max-age=31536000, immutable",
                },
              });
            } catch (posterError) {
              console.error("Error fetching poster from TMDB:", posterError);
            }
          }
        }
      } catch (error) {
        console.error("Error searching TMDB:", error);
      }
    }

    console.log(`No thumbnail found for movie: ${movie.title}, using placeholder`);
    // If no thumbnail is available, return a placeholder
    try {
      // For Vercel, redirect to the public placeholder
      const placeholderUrl = new URL("/placeholder-movie.jpg", req.nextUrl.origin);
      return NextResponse.redirect(placeholderUrl);
    } catch (error) {
      console.error("Error redirecting to placeholder:", error);
      return NextResponse.json(
        { error: "No thumbnail available" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error fetching thumbnail:", error);
    return NextResponse.json(
      { error: "Failed to fetch thumbnail" },
      { status: 500 }
    );
  }
} 