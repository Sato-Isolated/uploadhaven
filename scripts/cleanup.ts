import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { promises as fs } from 'fs'
import path from 'path'

// Load environment variables
dotenv.config({ path: '.env.local' })

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/uploadhaven'
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

// File model (simplified for cleanup script)
const fileSchema = new mongoose.Schema({
  filename: String,
  expiresAt: Date,
  isDeleted: { type: Boolean, default: false }
})

const File = mongoose.models.File || mongoose.model('File', fileSchema)

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log('Connected to MongoDB')
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}

async function cleanupExpiredFiles() {
  try {
    console.log('Starting cleanup of expired files...')
    
    await connectDB()
    
    const now = new Date()
    
    // Find expired files that aren't already marked as deleted
    const expiredFiles = await File.find({
      expiresAt: { $lt: now },
      isDeleted: false
    })

    console.log(`Found ${expiredFiles.length} expired files`)

    let deletedCount = 0
    let physicalDeletedCount = 0
    let errorCount = 0

    for (const file of expiredFiles) {
      try {
        // Mark as deleted in database
        await File.findByIdAndUpdate(file._id, { isDeleted: true })
        deletedCount++
        console.log(`Marked as deleted in DB: ${file.filename}`)

        // Try to delete physical file
        try {
          const filePath = path.join(UPLOADS_DIR, file.filename)
          await fs.unlink(filePath)
          physicalDeletedCount++
          console.log(`Deleted physical file: ${file.filename}`)
        } catch (fsError) {
          console.warn(`Could not delete physical file ${file.filename}:`, (fsError as Error).message)
        }
      } catch (error) {
        errorCount++
        console.error(`Error processing ${file.filename}:`, (error as Error).message)
      }
    }

    console.log(`Cleanup completed:`)
    console.log(`- Database entries marked as deleted: ${deletedCount}`)
    console.log(`- Physical files deleted: ${physicalDeletedCount}`)
    console.log(`- Errors: ${errorCount}`)

  } catch (error) {
    console.error('Cleanup failed:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupExpiredFiles().catch(console.error)
}

export { cleanupExpiredFiles }
