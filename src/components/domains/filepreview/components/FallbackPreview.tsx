'use client';

export default function FallbackPreview() {
  return (
    <div className="space-y-4 text-center">
      <div className="text-6xl text-gray-300">📄</div>
      <div className="text-gray-600">
        Preview not available for this file type
      </div>
      <div className="text-muted-foreground text-sm">
        Use the download button to view the file
      </div>
    </div>
  );
}
