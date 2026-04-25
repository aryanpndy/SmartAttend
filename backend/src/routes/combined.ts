// ─── Teaching Logs ─────────────────────────────────────────────────────────
import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

export const teachingLogRouter = Router()
const prisma = new PrismaClient()

teachingLogRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { teacherId, classId, date, limit = 20, offset = 0 } = req.query
    const where: any = {}
    if (teacherId) where.teacherId = teacherId
    if (classId) where.classId = classId
    if (date) where.date = new Date(date as string)
    if (req.user!.role === 'TEACHER') {
      const t = await prisma.teacher.findFirst({ where: { userId: req.user!.id } })
      if (t) where.teacherId = t.id
    }
    const [logs, total] = await Promise.all([
      prisma.teachingLog.findMany({
        where, include: { subject: true, class: true, teacher: { include: { user: { select: { name: true } } } } },
        orderBy: { date: 'desc' }, take: Number(limit), skip: Number(offset),
      }),
      prisma.teachingLog.count({ where }),
    ])
    res.json({ logs, total })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

teachingLogRouter.post('/', authenticate, requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response) => {
  try {
    const { classId, subjectId, date, topicsCovered, objectives, homework, notes, periodNumber } = req.body
    let teacherId = req.body.teacherId
    if (req.user!.role === 'TEACHER') {
      const t = await prisma.teacher.findFirst({ where: { userId: req.user!.id } })
      teacherId = t?.id
    }
    if (!teacherId || !classId || !subjectId || !date || !topicsCovered) {
      return res.status(400).json({ error: 'Required fields missing' })
    }
    const log = await prisma.teachingLog.create({
      data: { teacherId, classId, subjectId, date: new Date(date), topicsCovered, objectives, homework, notes, periodNumber: periodNumber || 1 },
      include: { subject: true, class: true },
    })
    res.status(201).json(log)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

teachingLogRouter.patch('/:id', authenticate, requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response) => {
  try {
    const log = await prisma.teachingLog.update({ where: { id: req.params.id }, data: req.body, include: { subject: true, class: true } })
    res.json(log)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

teachingLogRouter.delete('/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    await prisma.teachingLog.delete({ where: { id: req.params.id } })
    res.json({ message: 'Deleted' })
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// ─── Teacher Attendance ─────────────────────────────────────────────────────
export const teacherAttendanceRouter = Router()

teacherAttendanceRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { teacherId, date, month, year } = req.query
    const where: any = {}
    if (teacherId) where.teacherId = teacherId
    if (date) where.date = new Date(date as string)
    if (month && year) {
      const start = new Date(Number(year), Number(month) - 1, 1)
      const end = new Date(Number(year), Number(month), 0)
      where.date = { gte: start, lte: end }
    }
    if (req.user!.role === 'TEACHER') {
      const t = await prisma.teacher.findFirst({ where: { userId: req.user!.id } })
      if (t) where.teacherId = t.id
    }
    const records = await prisma.teacherAttendance.findMany({
      where, include: { teacher: { include: { user: { select: { name: true } } } } }, orderBy: { date: 'desc' },
    })
    res.json(records)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

teacherAttendanceRouter.post('/check-in', authenticate, requireRole('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    let teacherId = req.body.teacherId
    if (req.user!.role === 'TEACHER') {
      const t = await prisma.teacher.findFirst({ where: { userId: req.user!.id } })
      teacherId = t?.id
    }
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const record = await prisma.teacherAttendance.upsert({
      where: { teacherId_date: { teacherId, date: today } },
      update: { timeIn: new Date(), status: 'PRESENT' },
      create: { teacherId, date: today, timeIn: new Date(), status: 'PRESENT' },
    })
    res.json(record)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

teacherAttendanceRouter.post('/check-out', authenticate, requireRole('TEACHER', 'ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    let teacherId = req.body.teacherId
    if (req.user!.role === 'TEACHER') {
      const t = await prisma.teacher.findFirst({ where: { userId: req.user!.id } })
      teacherId = t?.id
    }
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const record = await prisma.teacherAttendance.update({
      where: { teacherId_date: { teacherId, date: today } },
      data: { timeOut: new Date() },
    })
    res.json(record)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// ─── Students ─────────────────────────────────────────────────────────────
export const studentRouter = Router()

studentRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { classId, search } = req.query
    const where: any = {}
    if (classId) where.classId = classId
    if (search) where.user = { name: { contains: search as string, mode: 'insensitive' } }
    const students = await prisma.student.findMany({
      where, include: { user: { select: { id: true, name: true, email: true, avatar: true, phone: true } }, class: true },
      orderBy: { user: { name: 'asc' } },
    })
    res.json(students)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

studentRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: { user: { select: { id: true, name: true, email: true, avatar: true, phone: true } }, class: true },
    })
    if (!student) return res.status(404).json({ error: 'Not found' })
    res.json(student)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

studentRouter.post('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, classId, rollNumber, parentName, parentPhone, dateOfBirth } = req.body
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'Email already exists' })
    const bcrypt = require('bcryptjs')
    const user = await prisma.user.create({
      data: {
        name, email, passwordHash: bcrypt.hashSync('Student@123', 10), role: 'STUDENT',
        student: { create: { classId, rollNumber, parentName, parentPhone, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined } },
      },
      include: { student: { include: { class: true } } },
    })
    res.status(201).json(user)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

// ─── Classes ─────────────────────────────────────────────────────────────
export const classRouter = Router()

classRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const classes = await prisma.class.findMany({
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        _count: { select: { students: true } },
      },
      orderBy: [{ grade: 'asc' }, { section: 'asc' }],
    })
    res.json(classes)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

classRouter.get('/:id/students', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      where: { classId: req.params.id },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { rollNumber: 'asc' },
    })
    res.json(students)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// ─── Users ─────────────────────────────────────────────────────────────
export const userRouter = Router()

userRouter.get('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.query
    const where: any = {}
    if (role) where.role = role
    const users = await prisma.user.findMany({
      where, select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true },
      orderBy: { name: 'asc' },
    })
    res.json(users)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

userRouter.patch('/:id', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, isActive } = req.body
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { name, email, phone, isActive },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    })
    res.json(user)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

// ─── Teachers ─────────────────────────────────────────────────────────────
export const teacherRouter = Router()

teacherRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const teachers = await prisma.teacher.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, isActive: true } },
        classes: true,
        _count: { select: { teachingLogs: true } },
      },
    })
    res.json(teachers)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

teacherRouter.post('/', authenticate, requireRole('ADMIN'), async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, phone, employeeId, qualification, specialization } = req.body
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ error: 'Email already exists' })
    const bcrypt = require('bcryptjs')
    const user = await prisma.user.create({
      data: {
        name, email, phone, passwordHash: bcrypt.hashSync('Teacher@123', 10), role: 'TEACHER',
        teacher: { create: { employeeId, qualification, specialization } },
      },
      include: { teacher: true },
    })
    res.status(201).json(user)
  } catch (err) { console.error(err); res.status(500).json({ error: 'Server error' }) }
})

// ─── Notifications ─────────────────────────────────────────────────────────
export const notificationRouter = Router()

notificationRouter.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    res.json(notifications)
  } catch { res.status(500).json({ error: 'Server error' }) }
})

notificationRouter.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const n = await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } })
    res.json(n)
  } catch { res.status(500).json({ error: 'Server error' }) }
})
