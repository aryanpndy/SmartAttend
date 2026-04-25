import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /export/attendance/csv?classId=&month=&year=
router.get('/attendance/csv', authenticate, requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response) => {
  try {
    const { classId, month, year } = req.query
    const y = Number(year) || new Date().getFullYear()
    const m = Number(month) || new Date().getMonth() + 1
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0)

    const records = await prisma.attendance.findMany({
      where: { ...(classId ? { classId: classId as string } : {}), date: { gte: start, lte: end } },
      include: {
        student: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } },
      },
      orderBy: [{ date: 'asc' }, { student: { rollNumber: 'asc' } }],
    })

    const rows = [
      ['Roll No', 'Student Name', 'Class', 'Date', 'Status', 'AI Marked', 'Confidence'].join(','),
      ...records.map(r => [
        r.student.rollNumber,
        `"${r.student.user.name}"`,
        `"${r.class.name}"`,
        r.date.toISOString().split('T')[0],
        r.status,
        r.isAiMarked ? 'Yes' : 'No',
        r.aiConfidence ? `${(r.aiConfidence * 100).toFixed(1)}%` : '',
      ].join(',')),
    ]

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="attendance_${y}_${String(m).padStart(2, '0')}.csv"`)
    res.send(rows.join('\n'))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Export failed' })
  }
})

// GET /export/teaching-logs/csv
router.get('/teaching-logs/csv', authenticate, requireRole('ADMIN', 'TEACHER'), async (req: AuthRequest, res: Response) => {
  try {
    const { teacherId, month, year } = req.query
    const y = Number(year) || new Date().getFullYear()
    const m = Number(month) || new Date().getMonth() + 1
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0)

    const where: any = { date: { gte: start, lte: end } }
    if (teacherId) where.teacherId = teacherId
    if (req.user!.role === 'TEACHER') {
      const t = await prisma.teacher.findFirst({ where: { userId: req.user!.id } })
      if (t) where.teacherId = t.id
    }

    const logs = await prisma.teachingLog.findMany({
      where,
      include: {
        teacher: { include: { user: { select: { name: true } } } },
        class: { select: { name: true } },
        subject: true,
      },
      orderBy: { date: 'asc' },
    })

    const rows = [
      ['Date', 'Teacher', 'Class', 'Subject', 'Topics Covered', 'Objectives', 'Homework'].join(','),
      ...logs.map(l => [
        l.date.toISOString().split('T')[0],
        `"${l.teacher.user.name}"`,
        `"${l.class.name}"`,
        `"${l.subject.name}"`,
        `"${l.topicsCovered.replace(/"/g, '""')}"`,
        `"${(l.objectives || '').replace(/"/g, '""')}"`,
        `"${(l.homework || '').replace(/"/g, '""')}"`,
      ].join(',')),
    ]

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="teaching_logs_${y}_${String(m).padStart(2, '0')}.csv"`)
    res.send(rows.join('\n'))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Export failed' })
  }
})

// GET /export/students/csv
router.get('/students/csv', authenticate, requireRole('ADMIN'), async (_req: AuthRequest, res: Response) => {
  try {
    const students = await prisma.student.findMany({
      include: {
        user: { select: { name: true, email: true, phone: true } },
        class: { select: { name: true } },
      },
      orderBy: { rollNumber: 'asc' },
    })

    const rows = [
      ['Roll No', 'Name', 'Email', 'Class', 'Parent Name', 'Parent Phone'].join(','),
      ...students.map(s => [
        s.rollNumber,
        `"${s.user.name}"`,
        s.user.email,
        `"${s.class.name}"`,
        `"${s.parentName || ''}"`,
        s.parentPhone || '',
      ].join(',')),
    ]

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', 'attachment; filename="students.csv"')
    res.send(rows.join('\n'))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Export failed' })
  }
})

export default router
