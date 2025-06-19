import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { ObjectId } from "mongodb";
import axios from "axios";

export async function GET(
  req: NextRequest,
  { params }: { params: { movieId: string } }
) {
  try {
    // Connect to MongoDB and get database client
    const client = await connectToDatabase();
    const db = client.db("teledriveDB");
    
    const movieId = await params.movieId;

    // Find the movie by ID
    const movie = await db.collection("movies").findOne({
      _id: new ObjectId(movieId),
    });

    if (!movie) {
      console.error(`Movie not found with ID: ${movieId}`);
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    // If the movie has a poster URL, use that
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

    // If the movie has a Telegram thumbnail, use it as fallback
    if (movie.thumb_file_id) {
      try {
        console.log(`Using Telegram thumbnail as fallback: ${movie.thumb_file_id}`);
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

    console.log(`No poster found for movie: ${movie.title}, using placeholder`);
    // If no poster is available, return a placeholder
    try {
      // For Vercel, redirect to the public placeholder
      const placeholderUrl = new URL("/placeholder-movie.jpg", req.nextUrl.origin);
      return NextResponse.redirect(placeholderUrl);
    } catch (error) {
      console.error("Error redirecting to placeholder:", error);
      return NextResponse.json(
        { error: "No poster available" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error fetching poster:", error);
    return NextResponse.json(
      { error: "Failed to fetch poster" },
      { status: 500 }
    );
  }
} 