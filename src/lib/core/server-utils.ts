import { nanoid } from 'nanoid';
import connectDB from '@/lib/database/mongodb';
import { File } from '@/lib/database/models';

interface ZKShareData {
  key?: string;
  keyHint?: 'random' | 'password';
  baseUrl?: string;
}

// Generate a unique short URL for file sharing (SERVER ONLY)
// Can optionally create Zero-Knowledge share links with embedded keys
export async function generateShortUrl(
  customAlias?: string,
  zkData?: ZKShareData
): Promise<string> {
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Use custom alias if provided, otherwise generate random ID
    const shortId = customAlias || nanoid(8); // 8 character short ID

    // Check if this short URL already exists in database
    try {
      await connectDB();
      const existingFile = await File.findOne({ shortUrl: shortId });

      if (!existingFile) {
        // If ZK data is provided, create a complete share link with key
        if (zkData) {
          const base =
            zkData.baseUrl ||
            process.env.NEXT_PUBLIC_BASE_URL ||
            'http://localhost:3000';
          const baseUrl = `${base}/s/${shortId}`;

          if (zkData.key) {
            // Random key - embed in URL fragment
            return `${baseUrl}#${zkData.key}`;
          } else if (zkData.keyHint === 'password') {
            // Password-based - add password flag
            return `${baseUrl}#password`;
          }

          // Fallback to base URL if no key/hint
          return baseUrl;
        }

        // Legacy mode - return only shortId
        return shortId;
      }

      // If custom alias already exists, throw error
      if (customAlias) {
        throw new Error('Custom alias already exists');
      }
    } catch (error) {
      if (customAlias) {
        throw error; // Re-throw custom alias errors
      }
      // For random generation, continue to next attempt
    }
  }

  throw new Error('Failed to generate unique short URL after maximum attempts');
}
