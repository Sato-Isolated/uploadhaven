# UploadHaven

🚀 **Simple, secure, ephemeral file sharing** - Upload, get link, share. That's it.

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-blue)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

A modern, privacy-first file sharing platform that focuses on simplicity and security. No accounts required, no permanent storage, just quick and secure temporary file transfers.

## 🎯 Core Philosophy

- **Upload** → **Get Link** → **Share** - Nothing more, nothing less
- **Ephemeral by design** - Files automatically expire
- **Privacy first** - Minimal data collection, maximum security
- **Open source forever** - Always free and transparent

## ✨ Key Features

- 📁 **Drag & Drop Upload** - Instant file sharing
- ⏰ **Auto-Expiration** - Files delete automatically (15min - 7 days)
- 🔒 **Security Scanning** - Malware detection built-in
- 📱 **Mobile Optimized** - Works perfectly on all devices
- 🔗 **Instant Links** - Share files immediately
- 🕵️ **Anonymous Mode** - No tracking, no accounts needed

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/Sato-Isolated/uploadhaven.git
cd uploadhaven
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your MongoDB URI

# Start development
pnpm dev
```

Visit `http://localhost:3000` and start sharing files! 🎉

## 📚 Documentation

| Topic | Description |
|-------|-------------|
| **[📖 Getting Started](docs/getting-started/)** | Installation and quick start guides |
| **[⚙️ Development](docs/development/)** | Setup, contributing, and development workflow |
| **[🔌 API Reference](docs/api/)** | Complete API documentation and examples |
| **[🎯 Features](docs/features/)** | Roadmap, ideas, and feature documentation |
| **[📋 Project Info](docs/project/)** | Technical details, changelog, and architecture |

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB
- **Security**: better-auth, malware scanning, rate limiting
- **Real-time**: Server-Sent Events (SSE)
- **Deployment**: Vercel, self-hosted options

## 🤝 Contributing

We welcome contributions! UploadHaven is built by the community, for the community.

- 💡 **Ideas**: Share your thoughts in [GitHub Discussions](https://github.com/Sato-Isolated/uploadhaven/discussions)
- 🐛 **Bugs**: Report issues in [GitHub Issues](https://github.com/Sato-Isolated/uploadhaven/issues)
- 🔧 **Code**: See our [Contributing Guide](docs/development/contributing.md)

## 📦 Self-Hosting

UploadHaven is designed to be easily self-hosted:

```bash
# Manual deployment
pnpm install
pnpm build
pnpm start
```

See the [Installation Guide](docs/getting-started/installation.md) for detailed setup instructions.

## 🔐 Security

- **Malware scanning** for all uploads
- **File type validation** and size limits
- **Rate limiting** to prevent abuse
- **No permanent storage** - files auto-delete
- **Password protection** for sensitive files

Report security issues in [GitHub Issues](https://github.com/Sato-Isolated/uploadhaven/issues)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🌟 Why UploadHaven?

Unlike complex file sharing platforms, UploadHaven focuses on **simplicity**:

- ✅ No user accounts required
- ✅ No complex folder structures
- ✅ No permanent file storage
- ✅ No premium features - always free

**Just upload, share, and let files expire naturally.**

---

<div align="center">

**[🚀 Get Started](docs/getting-started/quick-start.md)** • **[📖 Documentation](docs/)** • **[💬 Discussions](https://github.com/Sato-Isolated/uploadhaven/discussions)**

Made with ❤️ by the community

</div>
