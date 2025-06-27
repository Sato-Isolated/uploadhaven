import { MongoClient, Db, Collection, Document } from 'mongodb';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (cachedClient && cachedDb) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  const client = new MongoClient(uri);
  await client.connect();

  const db = client.db(process.env.MONGODB_DB || 'uploadhaven');

  cachedClient = client;
  cachedDb = db;

  return db;
}

export async function getCollection<T extends Document = Document>(collectionName: string): Promise<Collection<T>> {
  const db = await connectToDatabase();
  return db.collection<T>(collectionName);
}
