# 🚀 Deployment Guide - Excalidraw

This guide will help you deploy your Excalidraw application to production.

## 📋 Table of Contents
1. [Environment Setup](#environment-setup)
2. [Database Setup](#database-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Domain & CORS Configuration](#domain--cors-configuration)

---

## 🔧 Environment Setup

### 1. Root `.env` (Both Backends)

**✅ Already created locally** - Located at the project root.

For production deployment, update these values:

```env
# Generate a NEW JWT secret for production
JWT_SECRET=<generate-new-secret>

# Your production database URL
DATABASE_URL=postgresql://user:password@host:port/database?schema=public

# Your frontend domain for CORS
FRONTEND_URL=https://your-frontend-domain.com
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. Frontend `.env.local`

**✅ Already created** - Located at `apps/excalidraw-frontend/.env.local`

For production, set these environment variables in your hosting platform:

```env
NEXT_PUBLIC_HTTP_BACKEND=https://your-http-backend-domain.com
NEXT_PUBLIC_WS_URL=wss://your-websocket-backend-domain.com
```

---

## 💾 Database Setup

### Recommended Providers
- **Neon** (https://neon.tech) - Free tier, serverless PostgreSQL
- **Supabase** (https://supabase.com) - Free tier, includes auth
- **Railway** (https://railway.app) - Easy deployment
- **Render** (https://render.com) - Free tier available

### Setup Steps:
1. Create a PostgreSQL database on your chosen provider
2. Copy the connection string
3. Update `DATABASE_URL` in your `.env` file
4. Run migrations:
   ```bash
   cd packages/db
   npx prisma migrate deploy
   ```

---

## 🔌 Backend Deployment

You need to deploy **both** backend services:

### Option 1: Railway (Recommended)

**HTTP Backend:**
1. Create a new Railway project
2. Connect your GitHub repository
3. Set root directory: `apps/http-backend`
4. Add environment variables:
   - `JWT_SECRET`
   - `DATABASE_URL`
   - `FRONTEND_URL`
   - `JWT_EXPIRY_SECONDS=604800`
   - `BCRYPT_ROUNDS=12`
5. Railway will auto-detect and deploy

**WebSocket Backend:**
1. Add a new service to the same project
2. Set root directory: `apps/ws-backend`
3. Add environment variables:
   - `JWT_SECRET` (same as HTTP backend)
   - `DATABASE_URL` (same as HTTP backend)
4. Deploy

### Option 2: Render

**HTTP Backend:**
1. New Web Service > Connect repository
2. Build command: `cd apps/http-backend && npm install && npm run build`
3. Start command: `cd apps/http-backend && npm start`
4. Add environment variables (same as Railway)

**WebSocket Backend:**
1. Same process as HTTP backend
2. Use `apps/ws-backend` directory

### Option 3: Heroku

```bash
# HTTP Backend
heroku create your-app-http
git subtree push --prefix apps/http-backend heroku main

# WebSocket Backend
heroku create your-app-ws
git subtree push --prefix apps/ws-backend heroku main
```

---

## 🌐 Frontend Deployment

### Option 1: Vercel (Recommended for Next.js)

1. Import your GitHub repository
2. Root directory: `apps/excalidraw-frontend`
3. Framework preset: Next.js (auto-detected)
4. Add environment variables:
   ```
   NEXT_PUBLIC_HTTP_BACKEND=https://your-http-backend.railway.app
   NEXT_PUBLIC_WS_URL=wss://your-ws-backend.railway.app
   ```
5. Deploy

### Option 2: Netlify

1. Import repository
2. Base directory: `apps/excalidraw-frontend`
3. Build command: `npm run build`
4. Publish directory: `.next`
5. Add environment variables (same as Vercel)

### Option 3: Railway

Same process as backend deployment, select `apps/excalidraw-frontend`

---

## 🔐 Domain & CORS Configuration

### Update Backend CORS

After deploying frontend, update the `FRONTEND_URL` environment variable in your backend services:

```env
FRONTEND_URL=https://your-frontend-domain.vercel.app
```

### WebSocket Connection

Ensure WebSocket URL uses `wss://` (secure) in production:

```env
NEXT_PUBLIC_WS_URL=wss://your-ws-backend-domain.com
```

---

## ✅ Post-Deployment Checklist

- [ ] Database is accessible from backends
- [ ] JWT_SECRET is different from development
- [ ] All environment variables are set
- [ ] Frontend can connect to HTTP backend
- [ ] WebSocket connection works
- [ ] CORS allows your frontend domain
- [ ] Database migrations are applied
- [ ] Sign up/Sign in works
- [ ] Room creation works
- [ ] Real-time drawing syncs between users

---

## 🐛 Troubleshooting

### CORS Error
- Ensure `FRONTEND_URL` in backend matches your deployed frontend domain
- Check backend logs for CORS-related errors

### Database Connection Failed
- Verify `DATABASE_URL` is correct
- Check if database allows connections from your backend's IP
- For serverless databases (Neon), ensure `?sslmode=require` is in connection string

### WebSocket Not Connecting
- Ensure `NEXT_PUBLIC_WS_URL` uses `wss://` (not `ws://`)
- Check WebSocket backend is running and accessible
- Verify no firewall blocking WebSocket connections

### "Cannot find module '@repo/backend-common'"
- Run `pnpm install` at the root
- Run `pnpm run build` to compile shared packages
- Ensure monorepo structure is maintained in deployment

---

## 📚 Additional Resources

- [Turborepo Deployment](https://turbo.build/repo/docs/handbook/deploying-with-docker)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Production Best Practices](https://www.prisma.io/docs/guides/deployment/deployment-guides)

---

## 🎉 You're All Set!

Your Excalidraw app should now be live and ready for collaborative drawing!

Report issues: [GitHub Issues](https://github.com/your-repo/issues)
