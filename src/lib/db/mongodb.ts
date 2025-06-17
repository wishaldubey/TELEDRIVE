import { MongoClient } from 'mongodb';

// Hardcoded MongoDB URI
const MONGODB_URI = 'mongodb+srv://thevishaldubey:GOCORONAGO@teledrive.gt79wp0.mongodb.net/?retryWrites=true&w=majority';

// Check if we have a MongoDB URI
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Global is used here to maintain a cached connection across hot reloads
declare global {
  var mongo: {
    client: MongoClient | null;
    promise: Promise<MongoClient> | null;
  };
}

let cached = global.mongo;
if (!cached) {
  cached = global.mongo = { client: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.client) {
    return cached.client;
  }

  if (!cached.promise) {
    const opts = {
      maxPoolSize: 10,
    };

    cached.promise = MongoClient.connect(MONGODB_URI, opts)
      .then((client) => {
        console.log('Connected to MongoDB');
        return client;
      })
      .catch((error) => {
        console.error('Failed to connect to MongoDB:', error);
        throw error;
      });
  }

  try {
    cached.client = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.client;
}

export default connectToDatabase; 