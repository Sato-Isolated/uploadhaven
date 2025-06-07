import { MongoClient } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/uploadhaven";

async function checkUsers() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db();
    const users = await db.collection("user").find({}).toArray();

    console.log("📊 Users in database:");
    console.log("Total users:", users.length);

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User ID: ${user._id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Name: ${user.name || "N/A"}`);
      console.log(`   Role: ${user.role || "user"}`);
      console.log(`   Email Verified: ${user.emailVerified || false}`);
      console.log(`   Created: ${user.createdAt || "N/A"}`);
      console.log(`   Has Password: ${user.password ? "Yes" : "No"}`);
    });
  } catch (error) {
    console.error("Error checking users:", error);
  } finally {
    await client.close();
  }
}

// Load environment variables
import { config } from "dotenv";
config({ path: ".env.local" });

checkUsers();
