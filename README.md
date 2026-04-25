# SmartAttend — Primary School Attendance & Teaching Management System

A production-ready, AI-powered school management platform with face recognition attendance, role-based dashboards, and teaching log management.

---

## 🏗️ Architecture Overview

```
smartattend/
├── frontend/          # Next.js 14 + Tailwind CSS + TypeScript
├── backend/           # Node.js + Express + Prisma ORM
├── ai-service/        # Python FastAPI + face_recognition microservice
└── docs/              # API documentation & deployment guides
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 15+ (or Supabase/Neon)
- pnpm (recommended) or npm

### 1. Clone & Install

```bash
git clone https://github.com/yourorg/smartattend.git
cd smartattend

# Install frontend deps
cd frontend && pnpm install

# Install backend deps
cd ../backend && pnpm install

# Install Python AI service
cd ../ai-service && pip install -r requirements.txt
```

### 2. Environment Setup

```bash
# Copy example env files
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
cp ai-service/.env.example ai-service/.env
```

Fill in your values (see `.env.example` files for details).

### 3. Database Setup

```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run All Services

```bash
# Terminal 1 - Backend API
cd backend && pnpm dev

# Terminal 2 - Frontend
cd frontend && pnpm dev

# Terminal 3 - AI Service
cd ai-service && uvicorn app.main:app --reload --port 8000
```

Visit: http://localhost:3000

---

## 🔐 Default Seed Credentials

| Role    | Email                    | Password    |
|---------|--------------------------|-------------|
| Admin   | admin@school.edu         | Admin@123   |
| Teacher | sarah.johnson@school.edu | Teacher@123 |
| Student | (view via admin panel)   | Student@123 |

---

## 🚀 Deployment

### Frontend → Vercel
```bash
cd frontend
vercel --prod
```

### Backend → Railway / Render
```bash
# Set environment variables in Railway dashboard
# Connect GitHub repo → auto-deploy on push
```

### AI Service → Railway (Python)
```bash
# Dockerfile included in ai-service/
railway up
```

### Database → Supabase / Neon
1. Create project at supabase.com or neon.tech
2. Copy connection string to backend `.env`
3. Run `npx prisma migrate deploy`

---

## 📡 API Documentation

See `docs/api.md` for full REST API reference.

Base URL: `https://your-backend.railway.app/api/v1`

---

## 🐳 Docker (Optional)

```bash
docker-compose up --build
```

---

## 🧩 Key Features

- **AI Face Recognition**: TensorFlow.js (client-side) + Python fallback microservice
- **Real-time Attendance**: Webcam capture → face detection → auto-mark
- **Role-Based Access**: Admin / Teacher / Student with JWT auth
- **Analytics Dashboard**: Charts for attendance trends, class performance
- **Teaching Logs**: Structured daily logs with subject/topic tracking
- **Export**: CSV & PDF report generation
- **Dark Mode**: Full dark/light theme support
- **Mobile Responsive**: PWA-ready, works on tablets & phones
