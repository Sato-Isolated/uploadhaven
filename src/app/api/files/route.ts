import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import { File } from '@/lib/models'

export async function GET() {
  try {
    await connectDB()
      // Get all non-deleted files
    const files = await File.find({ isDeleted: false })
      .sort({ uploadDate: -1 })
      .lean()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fileList = files.map((file: any) => ({
      id: file._id.toString(),
      name: file.filename,
      originalName: file.originalName,
      size: file.size,
      uploadDate: file.uploadDate.toISOString(),
      expiresAt: file.expiresAt ? file.expiresAt.toISOString() : null,
      mimeType: file.mimeType,
      downloadCount: file.downloadCount || 0,
      type: getFileType(file.mimeType)
    }))

    return NextResponse.json({ files: fileList })
  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}

function getFileType(mimeType: string): 'image' | 'video' | 'audio' | 'document' | 'archive' | 'other' {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType.includes('pdf') || mimeType.includes('document') || mimeType.includes('text')) return 'document'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return 'archive'
  return 'other'
}
