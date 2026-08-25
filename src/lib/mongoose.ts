import mongoose from 'mongoose';

const MONGODB_URI = process.env.DATABASE_URL!;

console.log('[mongoose] DATABASE_URL is', MONGODB_URI ? 'defined' : 'MISSING');

if (!MONGODB_URI) {
  throw new Error('Please define the DATABASE_URL environment variable inside .env');
}

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    console.log('[mongoose] using cached database connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    console.log('[mongoose] creating new database connection...');

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('[mongoose] database connection established successfully');
      return mongoose;
    }).catch((err) => {
      console.log('[mongoose] database connection failed:', err instanceof Error ? err.message : err);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.log('[mongoose] error awaiting database connection:', e instanceof Error ? e.message : e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect;
