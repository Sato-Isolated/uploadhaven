import mongoose from 'mongoose';
// Import models to ensure they're registered when this module is loaded
import './models';

// Global variable to store the cached connection
declare global {
  /* eslint-disable no-var */
  var mongoose: {
    conn: typeof import('mongoose') | null;
    promise: Promise<typeof import('mongoose')> | null;
    isConnecting: boolean;
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
  cached = global.mongoose = { conn: null, promise: null, isConnecting: false };
}

// Connection configuration with proper pooling
const connectionOptions = {
  bufferCommands: false,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  maxConnecting: 2, // Maximum number of connections to attempt simultaneously
};

// Enhanced connection function with error handling and health checks
async function connectDB() {
  // Return existing connection if available and healthy
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // Prevent multiple connection attempts
  if (cached.isConnecting) {
    while (cached.isConnecting) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (cached.conn) return cached.conn;
  }

  if (!cached.promise) {
    cached.isConnecting = true;
    
    cached.promise = mongoose
      .connect(MONGODB_URI, connectionOptions)
      .then((mongoose) => {
        cached.isConnecting = false;
        console.log('✅ MongoDB connected successfully');
        
        // Set up connection event listeners
        mongoose.connection.on('error', (err) => {
          console.error('❌ MongoDB connection error:', err);
          cached.conn = null;
          cached.promise = null;
        });

        mongoose.connection.on('disconnected', () => {
          console.warn('⚠️ MongoDB disconnected');
          cached.conn = null;
          cached.promise = null;
        });

        mongoose.connection.on('reconnected', () => {
          console.log('🔄 MongoDB reconnected');
        });

        return mongoose;
      })
      .catch((error) => {
        cached.isConnecting = false;
        cached.promise = null;
        console.error('❌ MongoDB connection failed:', error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.isConnecting = false;
    throw error;
  }
}

// Health check function
export async function checkDBHealth(): Promise<boolean> {
  try {
    if (!cached.conn || mongoose.connection.readyState !== 1) {
      return false;
    }
    
    // Ping the database
    const db = mongoose.connection.db;
    if (!db) return false;
    
    await db.admin().ping();
    return true;
  } catch (error) {
    console.error('DB health check failed:', error);
    return false;
  }
}

// Graceful disconnect function
export async function disconnectDB(): Promise<void> {
  try {
    if (cached.conn) {
      await mongoose.disconnect();
      cached.conn = null;
      cached.promise = null;
      cached.isConnecting = false;
      console.log('✅ MongoDB disconnected gracefully');
    }
  } catch (error) {
    console.error('❌ Error disconnecting from MongoDB:', error);
  }
}

export default connectDB;
