"use client";

export default function FallbackPreview() {
  return (
    <div className="text-center space-y-4">
      <div className="text-6xl text-gray-300">📄</div>
      <div className="text-gray-600">
        Preview not available for this file type
      </div>
      <div className="text-sm text-muted-foreground">
        Use the download button to view the file
      </div>
    </div>
  );
}
