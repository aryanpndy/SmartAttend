# SmartAttend Deployment Guide

## Overview
SmartAttend uses **MongoDB** as the database (via Prisma ORM), **Node.js/Express** for the backend API, **Next.js** for the frontend, and **Python/FastAPI** for AI services.

## Option 1: Docker (Recommended for self-hosting)

```bash
# Clone repo
git clone https://github.com/yourorg/smartattend.git && cd smartattend

# Copy env files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
cp ai-service/.env.example ai-service/.env

# Edit backend/.env — set a strong JWT_SECRET
# Start all services (includes MongoDB)
docker-compose up --build -d

# Initialize database (Prisma automatically syncs MongoDB schema)
docker exec smartattend-api npx prisma db push
docker exec smartattend-api npm run db:seed
```

Visit http://localhost:3000

## Option 2: Cloud (Vercel + Railway + MongoDB Atlas)

### Step 1 — Database (MongoDB Atlas)

1. Go to https://www.mongodb.com/cloud/atlas → Create Account
2. Create a new cluster
3. Create a database user (username & password)
4. Get the connection string: `mongodb+srv://user:password@cluster.mongodb.net/smartattend`
5. Add your IP to the whitelist (or 0.0.0.0/0 for public access)

### Step 2 — Backend (Railway)

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Point to `/backend` directory
3. Add environment variables:
   ```
   DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/smartattend
   JWT_SECRET=<random 64-char string>
   FRONTEND_URL=https://your-app.vercel.app
   AI_SERVICE_URL=https://your-ai.railway.app
   PORT=5000
   NODE_ENV=production
   ```
4. After deploy, Prisma will initialize MongoDB automatically
   railway run pnpm db:seed
   ```

### Step 3 — AI Service (Railway)

1. New service → Deploy from GitHub → `/ai-service`
2. Railway auto-detects Python + Dockerfile
3. Environment variables:
   ```
   ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-backend.railway.app
   PORT=8000
   ```

### Step 4 — Frontend (Vercel)

1. Go to https://vercel.com → New Project → Import GitHub
2. Set root directory: `frontend`
3. Environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app/api/v1
   NEXT_PUBLIC_AI_SERVICE_URL=https://your-ai.railway.app
   ```
4. Deploy!

---

## Generating a Secure JWT Secret

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# or
openssl rand -hex 64
```

---

## Face Enrollment Workflow (Production)

After deployment, enroll each student's face:

```bash
# Using curl
curl -X POST https://your-ai.railway.app/api/enroll/{student_uuid} \
  -F "photo=@student_photo.jpg"

# Or use the built-in enrollment UI at /admin/students → click Enroll Face
```

For best accuracy:
- Use well-lit, front-facing photo
- Call the endpoint 3-5 times with different expressions/angles
- Minimum 480×480 resolution recommended

---

## Monitoring & Logs

```bash
# Docker logs
docker logs smartattend-api --tail 100 -f
docker logs smartattend-ai --tail 100 -f

# Railway
railway logs --service backend

# Database viewer
cd backend && npx prisma studio
```
