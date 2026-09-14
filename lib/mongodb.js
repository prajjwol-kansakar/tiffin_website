import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
const options = {};

/**
 * Returns a cached MongoClient, or null when no MONGODB_URI is configured.
 * The app must run in demo mode without a database, so callers should
 * check for null and fall back to sample/demo behaviour.
 */
let client = null;
let clientPromise = null;

export async function getDb() {
  if (!uri) {
    return null;
  }

  if (!clientPromise) {
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }

  try {
    const connected = await clientPromise;
    // Database name: allow override via the URI path, fall back to fresh_tiffin
    return connected.db();
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    return null;
  }
}

export function hasDbConfigured() {
  return Boolean(uri);
}
