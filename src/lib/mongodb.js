// lib/mongodb.js
import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,
  retryWrites: true,
  retryReads: true,
};

let client;
let clientPromise;

async function connectToDatabase() {
  try {
    if (!client) {
      client = new MongoClient(uri, options);
      await client.connect();
      console.log("MongoDB connected successfully");
    }
    return client;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    throw error;
  }
}

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = connectToDatabase();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  clientPromise = connectToDatabase();
}

export const getMongoClient = async () => {
  try {
    const client = await clientPromise;
    // Check if the connection is still alive
    await client.db().admin().ping();
    return client;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    // If connection is dead, try to reconnect
    client = null;
    clientPromise = connectToDatabase();
    return await clientPromise;
  }
};

export const getMongoDb = async () => {
  try {
    const client = await getMongoClient();
    const db = client.db(process.env.MONGODB_DB || 'expense');
    // Test the connection
    await db.admin().ping();
    return db;
  } catch (error) {
    console.error("Error getting MongoDB database:", error);
    throw new Error("Failed to connect to database: " + error.message);
  }
};

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;

