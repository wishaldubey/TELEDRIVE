import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";

export async function GET(req: NextRequest) {
  try {
    // Connect to MongoDB and get database client
    const client = await connectToDatabase();
    const db = client.db("teledriveDB");
    
    // Get query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "20");
    
    // Get movies sorted by downloads array length
    const movies = await db
      .collection("movies")
      .aggregate([
        {
          $addFields: {
            downloadsCount: { $size: { $ifNull: ["$downloads", []] } }
          }
        },
        { $sort: { downloadsCount: -1 } },
        { $limit: limit }
      ])
      .toArray();
    
    return NextResponse.json({ success: true, movies });
  } catch (error) {
    console.error("Error fetching trending movies:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch trending movies" },
      { status: 500 }
    );
  }
} 