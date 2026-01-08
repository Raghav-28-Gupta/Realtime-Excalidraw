# 🎨 Excalidraw - Real-time Collaborative Whiteboard

A modern, feature-rich collaborative drawing application built with Next.js, WebSockets, and PostgreSQL.

![Excalidraw](apps/excalidraw-frontend/public/logo.png)

## ✨ Features

- 🎨 **Multiple Drawing Tools**: Pencil, Rectangle, Circle, Diamond, Arrow, Line
- 🤝 **Real-time Collaboration**: See others draw in real-time via WebSockets
- 🎨 **Color Picker**: Choose from presets or create custom colors
- ✏️ **Stroke Width Control**: Thin, medium, thick, or extra thick lines
- 🗑️ **Eraser Tool**: Remove unwanted shapes
- 🔍 **Zoom & Pan**: Navigate large canvases with ease
- 💾 **Export Options**: PNG, SVG, or copy to clipboard
- 🔐 **Secure Authentication**: JWT-based user authentication
- 🏠 **Room Management**: Create or join drawing rooms
- ⌨️ **Keyboard Shortcuts**: Speed up your workflow
- 📱 **Responsive Design**: Works on all devices

## 🏗️ Architecture

This is a **Turborepo monorepo** containing:

### Apps
- **excalidraw-frontend**: Next.js 15 frontend application
- **http-backend**: Express.js REST API server
- **ws-backend**: WebSocket server for real-time collaboration

### Packages
- **@repo/db**: Prisma database client and schema
- **@repo/backend-common**: Shared backend utilities and config
- **@repo/common**: Shared types and constants
- **@repo/ui**: Shared React components
- **@repo/eslint-config**: Shared ESLint configuration
- **@repo/typescript-config**: Shared TypeScript configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm installed
- PostgreSQL database (local or hosted)

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd Excalidraw
```

### 2. Install Dependencies
```bash
pnpm install
```

### 3. Setup Environment Variables

**Quick Setup (Recommended):**
```bash
# Windows
setup.bat

# Linux/Mac
bash setup.sh
```

**Manual Setup:**

Create `.env` in the root directory:
```bash
cp .env.development .env
```

Create `apps/excalidraw-frontend/.env.local`:
```env
NEXT_PUBLIC_HTTP_BACKEND=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:8080
```

**Important:** Update `.env` with:
- Your PostgreSQL `DATABASE_URL`
- A secure `JWT_SECRET` (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)

### 4. Setup Database
```bash
cd packages/db
npx prisma migrate dev
npx prisma generate
```

### 5. Build Shared Packages
```bash
pnpm run build
```

### 6. Start Development
```bash
pnpm run dev
```

The app will be available at:
- Frontend: http://localhost:3000
- HTTP Backend: http://localhost:3001
- WebSocket: ws://localhost:8080

## 🎯 Usage

1. **Sign Up/Sign In** on the landing page
2. **Create a Room** or **Join an Existing Room**
3. **Start Drawing** with the toolbar at the top
4. **Invite Others** to see real-time collaboration
5. **Export Your Work** using the export button

## ⌨️ Keyboard Shortcuts

| Tool | Shortcut |
|------|----------|
| Pencil | `P` |
| Rectangle | `R` |
| Circle | `C` |
| Diamond | `D` |
| Arrow | `A` |
| Line | `L` |
| Eraser | `E` |
| Pan/Hand | `H` |
| Zoom In | `Ctrl/Cmd + +` |
| Zoom Out | `Ctrl/Cmd + -` |
| Reset Zoom | `Ctrl/Cmd + 0` |

## 📦 Tech Stack

### Frontend
- **Next.js 15** - React framework
- **TailwindCSS 4** - Styling
- **RoughJS** - Hand-drawn style graphics
- **Lucide React** - Icons
- **Axios** - HTTP client

### Backend
- **Express.js** - HTTP server
- **ws** - WebSocket server
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcrypt** - Password hashing
- **Zod** - Schema validation

### DevOps
- **Turborepo** - Monorepo management
- **TypeScript** - Type safety
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 🚢 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

### Quick Deploy Options

**Frontend (Vercel):**
- ✅ Connect GitHub repository
- ✅ Select `apps/excalidraw-frontend`
- ✅ Add environment variables
- ✅ Deploy

**Backend (Railway):**
- ✅ Create two services (HTTP + WebSocket)
- ✅ Set root directories
- ✅ Add environment variables
- ✅ Deploy

## 📁 Project Structure

```
Excalidraw/
├── apps/
│   ├── excalidraw-frontend/    # Next.js frontend
│   ├── http-backend/           # Express HTTP API
│   └── ws-backend/             # WebSocket server
├── packages/
│   ├── db/                     # Prisma database
│   ├── backend-common/         # Shared backend code
│   ├── common/                 # Shared types
│   ├── ui/                     # Shared components
│   ├── eslint-config/          # ESLint config
│   └── typescript-config/      # TypeScript config
├── .env.development            # Development environment template
├── .env.production             # Production environment template
├── setup.bat                   # Windows setup script
├── setup.sh                    # Linux/Mac setup script
└── DEPLOYMENT.md              # Deployment guide
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgements

- Inspired by [Excalidraw](https://excalidraw.com/)
- Built with [Turborepo](https://turbo.build/)
- Powered by [Next.js](https://nextjs.org/)

---

**Made with ❤️ for creators**
