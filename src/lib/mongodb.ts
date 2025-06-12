import mongoose from 'mongoose';
// Import models to ensure they're registered when this module is loaded
import './models';

// Global variable to store the cached connection
declare global {
  /* eslint-disable no-var */
  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
  };
  /* eslint-enable no-var */
}

const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/uploadhaven';

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
