import { Router, Response } from 'express'
import { z } from 'zod'
import { PrismaClient, AttendanceStatus } from '@prisma/client'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs'

const router = Router()
const prisma = new PrismaClient()

// Multer setup for photo uploads
const uploadDir = path.join(__dirname, '../../uploads/attendance')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (_, file, cb) => cb(null, `${uuidv4()}${path.extname(file.originalname)}`),
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

// GET /attendance?classId=&date=
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { classId, date, studentId } = req.query
    const where: any = {}

    if (req.user!.role === 'STUDENT') {
      const student = await prisma.student.findFirst({ where: { userId: req.user!.id } })
      if (!student) return res.status(404).json({ error: 'Student not found' })
      where.studentId = student.id
    } else {
      if (classId) where.classId = classId as string
      if (studentId) where.studentId = studentId as string
    }

    if (date) where.date = new Date(date as string)

    const records = await prisma.attendance.findMany({
      where,
      include: {
        student: { include: { user: { select: { name: true, email: true } } } },
        class: { select: { name: true, grade: true, section: true } },
      },
      orderBy: { date: 'desc' },
    })

    res.json(records)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /attendance/bulk - bulk create/update for a class
router.post('/bulk', authenticate, requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response) => {
  try {
    const { classId, date, records } = req.body
    // records: [{ studentId, status, notes? }]
    if (!classId || !date || !Array.isArray(records)) {
      return res.status(400).json({ error: 'classId, date, and records[] required' })
    }

    const d = new Date(date)
    const results = []

    for (const rec of records) {
      const result = await prisma.attendance.upsert({
        where: { studentId_date: { studentId: rec.studentId, date: d } },
        update: {
          status: rec.status,
          notes: rec.notes,
          markedBy: req.user!.id,
          isAiMarked: rec.isAiMarked ?? false,
          aiConfidence: rec.aiConfidence,
          photoRef: rec.photoRef,
        },
        create: {
          studentId: rec.studentId,
          classId,
          date: d,
          status: rec.status || AttendanceStatus.PRESENT,
          notes: rec.notes,
          markedBy: req.user!.id,
          isAiMarked: rec.isAiMarked ?? false,
          aiConfidence: rec.aiConfidence,
          photoRef: rec.photoRef,
        },
      })
      results.push(result)
    }

    res.json({ message: `${results.length} attendance records saved`, results })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// PATCH /attendance/:id - manual correction
router.patch('/:id', authenticate, requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response) => {
  try {
    const { status, notes } = req.body
    const updated = await prisma.attendance.update({
      where: { id: req.params.id },
      data: { status, notes, markedBy: req.user!.id, isAiMarked: false },
    })
    res.json(updated)
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /attendance/summary/:classId
router.get('/summary/:classId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { classId } = req.params
    const { month, year } = req.query

    const startDate = new Date(Number(year) || new Date().getFullYear(), Number(month) - 1 || new Date().getMonth(), 1)
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)

    const records = await prisma.attendance.findMany({
      where: { classId, date: { gte: startDate, lte: endDate } },
      include: { student: { include: { user: { select: { name: true } } } } },
    })

    // Group by student
    const summary: Record<string, any> = {}
    for (const rec of records) {
      const sid = rec.studentId
      if (!summary[sid]) {
        summary[sid] = {
          studentId: sid,
          studentName: rec.student.user.name,
          total: 0, present: 0, absent: 0, late: 0,
        }
      }
      summary[sid].total++
      if (rec.status === 'PRESENT') summary[sid].present++
      else if (rec.status === 'ABSENT') summary[sid].absent++
      else if (rec.status === 'LATE') summary[sid].late++
    }

    res.json(Object.values(summary))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /attendance/upload-photo - upload class photo for AI processing
router.post('/upload-photo', authenticate, requireRole('ADMIN', 'TEACHER'), upload.single('photo'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo uploaded' })
    const photoUrl = `/uploads/attendance/${req.file.filename}`
    res.json({ photoUrl, message: 'Photo uploaded. Send to AI service for processing.' })
  } catch {
    res.status(500).json({ error: 'Upload failed' })
  }
})

export default router
