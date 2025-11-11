# OuterDrop

🚀 **Deploy. Share. Vanish.** - Secure file sharing with zero-knowledge encryption.

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
- 🔒 **Automatic Encryption** - All files encrypted with AES-256-GCM
- ⏰ **Auto-Expiration** - Files delete automatically (15min - 7 days)
- 🔗 **Instant Links** - Share files immediately
- 🕵️ **Anonymous Mode** - No tracking, no accounts needed

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/Sato-Isolated/outerdrop.git
cd outerdrop
pnpm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your MongoDB URI

# Start development
pnpm dev
```

Visit `http://localhost:3000` and start sharing files! 🎉

## 🧪 Testing

OuterDrop includes comprehensive testing to ensure security and reliability:

```bash
# Run the complete upload/download test
node test-real-api.js

# Prerequisites: Server must be running
pnpm dev
```

**✅ Current Test Status:**
- Upload flow: Fully tested with real API
- Download flow: Fully tested with real API  
- Zero-knowledge security: Validated
- Data integrity: Verified

See [TESTING-STATUS.md](TESTING-STATUS.md) for detailed test results.

## 📚 Documentation

| Topic | Description |
|-------|-------------|
| **[📖 Getting Started](docs/getting-started/)** | Installation and quick start guides |
| **[⚙️ Development](docs/development/)** | Setup, contributing, and development workflow |
| **[🔌 API Reference](docs/api/)** | Complete API documentation and examples |
| **[🎯 Features](docs/features/)** | Roadmap, ideas, and feature documentation |
| **[🔒 Encryption](docs/features/file-encryption.md)** | Complete encryption system documentation |
| **[📋 Project Info](docs/project/)** | Technical details, changelog, and architecture |

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB
- **Security**: better-auth, malware scanning, rate limiting
- **Real-time**: Server-Sent Events (SSE)
- **Deployment**: Vercel, self-hosted options

## 🤝 Contributing

We welcome contributions! OuterDrop is built by the community, for the community.

- 💡 **Ideas**: Share your thoughts in [GitHub Discussions](https://github.com/Sato-Isolated/outerdrop/discussions)
- 🐛 **Bugs**: Report issues in [GitHub Issues](https://github.com/Sato-Isolated/outerdrop/issues)
- 🔧 **Code**: See our [Contributing Guide](docs/development/contributing.md)

## 📦 Self-Hosting

OuterDrop is designed to be easily self-hosted:

```bash
# Manual deployment
pnpm install
pnpm build
pnpm start
```

See the [Installation Guide](docs/getting-started/installation.md) for detailed setup instructions.

## 🔐 Security

- **File encryption** with AES-256-GCM algorithm
- **File type validation** and size limits
- **Rate limiting** to prevent abuse
- **No permanent storage** - files auto-delete
- **Password protection** for sensitive files
- **Transparent decryption** for previews and downloads

Report security issues in [GitHub Issues](https://github.com/Sato-Isolated/outerdrop/issues)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🌟 Why OuterDrop?

Unlike complex file sharing platforms, OuterDrop focuses on **simplicity**:

- ✅ No user accounts required
- ✅ No complex folder structures
- ✅ No permanent file storage

**Just deploy, share, and let files vanish naturally.**

---

<div align="center">

**[🚀 Get Started](docs/getting-started/quick-start.md)** • **[📖 Documentation](docs/)** • **[💬 Discussions](https://github.com/Sato-Isolated/outerdrop/discussions)**

Made with ❤️ by the community

</div>
