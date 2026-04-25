import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config()

import authRoutes from './routes/auth'
import userRoutes from './routes/users'
import studentRoutes from './routes/students'
import teacherRoutes from './routes/teachers'
import classRoutes from './routes/classes'
import attendanceRoutes from './routes/attendance'
import teacherAttendanceRoutes from './routes/teacherAttendance'
import teachingLogRoutes from './routes/teachingLogs'
import analyticsRoutes from './routes/analytics'
import exportRoutes from './routes/export'
import notificationRoutes from './routes/notifications'

const app = express()
const PORT = process.env.PORT || 5000

// ── Security Middleware ────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}))
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}))

// ── Rate Limiting ─────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
})
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts.' },
})
app.use('/api/', limiter)
app.use('/api/v1/auth/', authLimiter)

// ── General Middleware ─────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// ── Static Files ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

// ── Health Check ───────────────────────────────────────────────────────────
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' })
})

// ── API Routes ─────────────────────────────────────────────────────────────
const v1 = '/api/v1'
app.use(`${v1}/auth`, authRoutes)
app.use(`${v1}/users`, userRoutes)
app.use(`${v1}/students`, studentRoutes)
app.use(`${v1}/teachers`, teacherRoutes)
app.use(`${v1}/classes`, classRoutes)
app.use(`${v1}/attendance`, attendanceRoutes)
app.use(`${v1}/teacher-attendance`, teacherAttendanceRoutes)
app.use(`${v1}/teaching-logs`, teachingLogRoutes)
app.use(`${v1}/analytics`, analyticsRoutes)
app.use(`${v1}/export`, exportRoutes)
app.use(`${v1}/notifications`, notificationRoutes)

// ── 404 Handler ───────────────────────────────────────────────────────────
app.use('*', (_, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ── Global Error Handler ──────────────────────────────────────────────────
app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err.stack)
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
})

app.listen(PORT, () => {
  console.log(`🚀 SmartAttend API running on http://localhost:${PORT}`)
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`)
})

export default app
