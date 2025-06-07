# UploadHaven

A modern file uploader, built with Next.js 15, TypeScript, and ShadCN/UI. UploadHaven provides a clean, simple interface for uploading files with drag & drop functionality and instant sharing capabilities.

![UploadHaven Screenshot](https://via.placeholder.com/800x400/3B82F6/FFFFFF?text=UploadHaven+-+Modern+File+Uploader)

## Features

- 🚀 **Drag & Drop Upload** - Simply drag files or click to select multiple files
- 📱 **Responsive Design** - Works perfectly on desktop and mobile devices
- 🔗 **Instant Sharing** - Get shareable links immediately after upload
- 🛡️ **Secure & Private** - Files are validated and stored securely
- ⚡ **Fast Performance** - Built with Next.js and modern web technologies
- 🎨 **Beautiful UI** - Clean, modern interface using ShadCN/UI components
- 📊 **File Management** - Track and manage your uploaded files
- 🔌 **API Access** - RESTful API for programmatic file uploads

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN/UI
- **File Handling**: React Dropzone
- **Validation**: Zod
- **Icons**: Lucide React

## Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/uploadhaven.git
   cd uploadhaven
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Configuration

### Upload Limits

The current configuration supports:

- **Maximum file size**: 100 MB
- **Supported formats**: 
  - Images: JPEG, PNG, GIF, WebP
  - Documents: PDF, TXT
  - Archives: ZIP
  - Video: MP4
  - Audio: MP3

You can modify these limits in `src/components/FileUploader.tsx`:

```typescript
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  // ... add more types
]
```

### Storage

Files are currently stored in the local `uploads/` directory. For production deployments, consider:

- Cloud storage (AWS S3, Google Cloud Storage, etc.)
- CDN integration for faster file delivery
- Database for file metadata and management

## API Documentation

### Upload File

**Endpoint**: `POST /api/upload`

**Request**: 
- Content-Type: `multipart/form-data`
- Field name: `file`

**Example**:
```bash
curl -X POST \
  -F "file=@example.jpg" \
  http://localhost:3000/api/upload
```

**Response**:
```json
{
  "message": "File uploaded successfully",
  "filename": "unique-filename.jpg",
  "url": "/api/files/unique-filename.jpg"
}
```

### Download File

**Endpoint**: `GET /api/files/[filename]`

**Example**:
```bash
curl http://localhost:3000/api/files/unique-filename.jpg
```

## Development

### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   │   ├── upload/     # Upload endpoint
│   │   └── files/      # File serving
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── ui/            # ShadCN/UI components
│   ├── FileUploader.tsx
│   ├── FileManager.tsx
│   └── InfoPanel.tsx
└── lib/               # Utilities
    └── utils.ts
```

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to [Vercel](https://vercel.com)
3. Deploy with default settings

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Manual Deployment

1. Build the application: `npm run build`
2. Start the production server: `npm start`

## Environment Variables

Create a `.env.local` file for local development:

```env
# Add any environment variables here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Security Considerations

- File type validation is enforced
- File size limits prevent abuse
- Unique filenames prevent conflicts
- Consider adding rate limiting for production
- Implement user authentication if needed
- Set up file expiration for automatic cleanup

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components by [ShadCN/UI](https://ui.shadcn.com/)
- Icons by [Lucide](https://lucide.dev/)

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/uploadhaven/issues) page
2. Create a new issue if needed
3. Join our community discussions

---

**UploadHaven** - Making file sharing simple and beautiful. 🚀
