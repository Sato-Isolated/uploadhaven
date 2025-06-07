import { nanoid } from "nanoid";
import connectDB from "./mongodb";
import { File } from "./models";

// Generate a unique short URL for file sharing (SERVER ONLY)
export async function generateShortUrl(customAlias?: string): Promise<string> {
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Use custom alias if provided, otherwise generate random ID
    const shortId = customAlias || nanoid(8); // 8 character short ID

    // Check if this short URL already exists in database
    try {
      await connectDB();
      const existingFile = await File.findOne({ shortUrl: shortId });

      if (!existingFile) {
        return shortId;
      }

      // If custom alias already exists, throw error
      if (customAlias) {
        throw new Error("Custom alias already exists");
      }
    } catch (error) {
      if (customAlias) {
        throw error; // Re-throw custom alias errors
      }
      // For random generation, continue to next attempt
    }
  }

  throw new Error("Failed to generate unique short URL after maximum attempts");
}

// Build full short URL for sharing
export function buildShortUrl(shortId: string, baseUrl?: string): string {
  const base =
    baseUrl || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  return `${base}/s/${shortId}`;
}
