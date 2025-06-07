import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import connectDB from "@/lib/mongodb";
import { File } from "@/lib/models";
import DeleteFileButton from "@/components/DeleteFileButton";

async function getUserFiles(userId: string) {
  await connectDB();
  return await File.find({
    userId: userId,
    isDeleted: false,
  })
    .sort({ uploadDate: -1 })
    .limit(50)
    .lean();
}

interface FileData {
  _id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadDate: Date;
  expiresAt: Date;
  // Visibility removed - all files use security by obscurity
  downloadCount?: number;
}

export default async function UserFilesPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/signin");
  }

  const files = (await getUserFiles(session.user.id)) as unknown as FileData[];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              My Files
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your uploaded files
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
            <Link href="/">
              <Button>Upload New File</Button>
            </Link>
          </div>
        </div>

        {/* Files List */}
        {files.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No files uploaded yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Start by uploading your first file
                </p>
                <Link href="/">
                  <Button>Upload Files</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {files.map((file: FileData) => (
              <Card key={file._id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {file.originalName}
                      </CardTitle>
                      <CardDescription>
                        Uploaded
                        {new Date(file.uploadDate).toLocaleDateString()} •
                        {(file.size / 1024 / 1024).toFixed(2)} MB •
                        {file.downloadCount} downloads
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`/api/files/${file.filename}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Download
                        </a>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/api/files/${file.filename}`
                          );
                        }}
                      >
                        Copy Link
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-4">
                      <span>Type: {file.mimeType}</span>
                      <span>
                        Expires: {new Date(file.expiresAt).toLocaleDateString()}
                      </span>
                      {/* Visibility indicator removed - all files use security by obscurity */}
                    </div>
                    <div className="flex items-center gap-2">
                      <DeleteFileButton
                        filename={file.filename}
                        fileName={file.originalName}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
