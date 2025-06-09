"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Download,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  File,
  Calendar,
  HardDrive,
  Lock,
  AlertCircle,
  CheckCircle,
  Eye,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

interface FileInfo {
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadDate: string;
  expiresAt?: string;
  downloadCount: number;
  isPasswordProtected: boolean;
}

export default function FilePreviewClient() {
  const params = useParams();
  const shortUrl = params.shortUrl as string;

  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fetchFileInfo = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/preview/${shortUrl}`);
      const data = await response.json();

      if (data.success) {
        if (data.passwordRequired) {
          setPasswordRequired(true);
        } else {
          setFileInfo(data.fileInfo);
        }    } else {
      setError(data.error || "Failed to load file information");
    }
  } catch (err) {
    setError("Network error. Please try again.");
    // Error fetching file info
  } finally {
      setLoading(false);
    }
  }, [shortUrl]);

  useEffect(() => {
    fetchFileInfo();
  }, [fetchFileInfo]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    try {
      setPasswordLoading(true);

      const response = await fetch(`/s/${shortUrl}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const result = await response.json();

      if (result.success) {
        setPasswordRequired(false);
        setFileInfo(result.fileInfo);
        toast.success("Password verified successfully!");
      } else {
        toast.error(result.error || "Invalid password");    }
  } catch (err) {
    toast.error("Failed to verify password");
    // Password verification error
  } finally {
      setPasswordLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);

      // Create download URL with verification if needed
      const downloadUrl = passwordRequired
        ? `/s/${shortUrl}?verified=${Date.now()}`
        : `/api/download/${shortUrl}`;

      // Create a temporary link to trigger download
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = fileInfo?.originalName || "download";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);      toast.success("Download started!");
    } catch (err) {
      toast.error("Failed to start download");
      // Download error
    } finally {
      setDownloading(false);
    }
  };

  const copyShareLink = () => {
    const shareUrl = `${window.location.origin}/s/${shortUrl}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Share link copied to clipboard!");
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };  const getFileIcon = (mimeType: string | undefined) => {
    if (!mimeType) return <File className="h-8 w-8" />;
    // eslint-disable-next-line jsx-a11y/alt-text
    if (mimeType.startsWith("image/")) return <Image className="h-8 w-8" />;
    if (mimeType.startsWith("video/")) return <Video className="h-8 w-8" />;
    if (mimeType.startsWith("audio/")) return <Music className="h-8 w-8" />;
    if (mimeType.includes("zip") || mimeType.includes("archive"))
      return <Archive className="h-8 w-8" />;
    if (mimeType.startsWith("text/") || mimeType.includes("document"))
      return <FileText className="h-8 w-8" />;
    return <File className="h-8 w-8" />;
  };

  const getFileTypeLabel = (mimeType: string | undefined) => {
    if (!mimeType) return "File";
    if (mimeType.startsWith("image/")) return "Image";
    if (mimeType.startsWith("video/")) return "Video";
    if (mimeType.startsWith("audio/")) return "Audio";
    if (mimeType.includes("zip") || mimeType.includes("archive"))
      return "Archive";
    if (mimeType.startsWith("text/")) return "Text";
    if (mimeType.includes("pdf")) return "PDF";
    return "File";
  };

  const isFileExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Loading file information...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-6 w-6 text-red-600" />
              <CardTitle className="text-red-900">Error</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <Button
              onClick={fetchFileInfo}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Lock className="h-6 w-6 text-amber-600" />
              <CardTitle>Password Required</CardTitle>
            </div>
            <CardDescription>
              This file is password protected. Please enter the password to view
              and download.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={passwordLoading}
                autoFocus
              />
              <Button
                type="submit"
                className="w-full"
                disabled={passwordLoading || !password.trim()}
              >
                {passwordLoading ? "Verifying..." : "Access File"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!fileInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">File information not available</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const expired = isFileExpired(fileInfo.expiresAt);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">UploadHaven</h1>
          <p className="text-gray-600">File Preview & Download</p>
        </div>

        {/* Main Card */}
        <Card className="shadow-xl">
          <CardHeader>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 text-blue-600">
                {getFileIcon(fileInfo.mimeType)}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl font-semibold truncate">
                  {fileInfo.originalName}
                </CardTitle>
                <CardDescription className="flex items-center space-x-2 mt-2">
                  <Badge variant="secondary">
                    {getFileTypeLabel(fileInfo.mimeType)}
                  </Badge>
                  {fileInfo.isPasswordProtected && (
                    <Badge
                      variant="outline"
                      className="text-amber-600 border-amber-200"
                    >
                      <Lock className="h-3 w-3 mr-1" />
                      Protected
                    </Badge>
                  )}
                  {expired && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Expired
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* File Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <HardDrive className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium">
                    {formatFileSize(fileInfo.size)}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Eye className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Downloads:</span>
                  <span className="font-medium">{fileInfo.downloadCount}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Uploaded:</span>
                  <span className="font-medium">
                    {new Date(fileInfo.uploadDate).toLocaleDateString()}
                  </span>
                </div>
                {fileInfo.expiresAt && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">Expires:</span>
                    <span
                      className={`font-medium ${expired ? "text-red-600" : ""}`}
                    >
                      {new Date(fileInfo.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-3">
              {!expired ? (
                <Button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <Download className="h-5 w-5 mr-2" />
                  {downloading ? "Starting Download..." : "Download File"}
                </Button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <AlertCircle className="h-6 w-6 text-red-600 mx-auto mb-2" />
                  <p className="text-red-800 font-medium">
                    This file has expired
                  </p>
                  <p className="text-red-600 text-sm">
                    Download is no longer available
                  </p>
                </div>
              )}

              <Button
                onClick={copyShareLink}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Share2 className="h-5 w-5 mr-2" />
                Copy Share Link
              </Button>
            </div>

            {/* Security Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  Secure Download
                </span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                This file has been scanned and is safe to download.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>Powered by UploadHaven - Secure File Sharing</p>
        </div>
      </div>
    </div>
  );
}
