// utils.ts - Utility functions for FileUploader

export const getFileType = (
  filename: string
): "image" | "video" | "audio" | "document" | "archive" | "other" => {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
    return "image";
  } else if (["mp4", "webm", "avi", "mov"].includes(ext)) {
    return "video";
  } else if (["mp3", "wav", "ogg", "flac"].includes(ext)) {
    return "audio";
  } else if (["pdf", "txt", "md", "doc", "docx"].includes(ext)) {
    return "document";
  } else if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return "archive";
  }
  return "other";
};

export const copyToClipboard = async (url: string, label: string = "URL") => {
  try {
    await navigator.clipboard.writeText(url);
    return { success: true, message: `${label} copied to clipboard!` };
  } catch {
    return { success: false, message: `Failed to copy ${label}` };
  }
};

export const saveFileToLocalStorage = (fileInfo: {
  name: string;
  size: number;
  uploadDate: string;
  type: string;
  expiresAt: string;
}) => {
  try {
    const savedFiles = localStorage.getItem("uploadedFiles");
    const filesList = savedFiles ? JSON.parse(savedFiles) : [];
    filesList.push(fileInfo);
    localStorage.setItem("uploadedFiles", JSON.stringify(filesList));
  } catch (error) {
    console.error("Error saving file info:", error);
  }
};
