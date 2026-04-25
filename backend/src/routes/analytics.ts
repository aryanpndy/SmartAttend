import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

// GET /analytics/dashboard - admin/teacher overview
router.get('/dashboard', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayEnd = new Date(today)
    todayEnd.setHours(23, 59, 59, 999)

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      todayPresent,
      todayAbsent,
      todayTotal,
      teachersPresentToday,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.attendance.count({ where: { date: today, status: 'PRESENT' } }),
      prisma.attendance.count({ where: { date: today, status: 'ABSENT' } }),
      prisma.attendance.count({ where: { date: today } }),
      prisma.teacherAttendance.count({ where: { date: today, status: 'PRESENT' } }),
    ])

    // Last 7 days attendance trend
    const trend = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      if (d.getDay() === 0 || d.getDay() === 6) continue
      const [p, a] = await Promise.all([
        prisma.attendance.count({ where: { date: d, status: 'PRESENT' } }),
        prisma.attendance.count({ where: { date: d, status: 'ABSENT' } }),
      ])
      trend.push({
        date: d.toISOString().split('T')[0],
        present: p,
        absent: a,
        total: p + a,
      })
    }

    // Per-class breakdown
    const classes = await prisma.class.findMany({ include: { students: true } })
    const classStats = await Promise.all(
      classes.map(async (cls) => {
        const [present, total] = await Promise.all([
          prisma.attendance.count({ where: { classId: cls.id, date: today, status: 'PRESENT' } }),
          prisma.attendance.count({ where: { classId: cls.id, date: today } }),
        ])
        return { classId: cls.id, className: cls.name, present, total, enrolled: cls.students.length }
      })
    )

    res.json({
      summary: {
        totalStudents,
        totalTeachers,
        totalClasses,
        todayPresent,
        todayAbsent,
        todayTotal,
        teachersPresentToday,
        attendanceRate: todayTotal > 0 ? Math.round((todayPresent / todayTotal) * 100) : 0,
      },
      trend,
      classStats,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /analytics/student/:studentId
router.get('/student/:studentId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params
    const { months = 3 } = req.query

    // If student role, verify it's their own data
    if (req.user!.role === 'STUDENT') {
      const student = await prisma.student.findFirst({ where: { userId: req.user!.id } })
      if (student?.id !== studentId) return res.status(403).json({ error: 'Access denied' })
    }

    const since = new Date()
    since.setMonth(since.getMonth() - Number(months))

    const records = await prisma.attendance.findMany({
      where: { studentId, date: { gte: since } },
      orderBy: { date: 'asc' },
    })

    const stats = {
      total: records.length,
      present: records.filter(r => r.status === 'PRESENT').length,
      absent: records.filter(r => r.status === 'ABSENT').length,
      late: records.filter(r => r.status === 'LATE').length,
      percentage: 0,
    }
    stats.percentage = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0

    // Monthly breakdown
    const monthly: Record<string, any> = {}
    for (const rec of records) {
      const key = rec.date.toISOString().slice(0, 7) // YYYY-MM
      if (!monthly[key]) monthly[key] = { month: key, present: 0, absent: 0, late: 0 }
      if (rec.status === 'PRESENT') monthly[key].present++
      else if (rec.status === 'ABSENT') monthly[key].absent++
      else if (rec.status === 'LATE') monthly[key].late++
    }

    res.json({ stats, monthly: Object.values(monthly), records })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /analytics/teacher/:teacherId
router.get('/teacher/:teacherId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { teacherId } = req.params

    const since = new Date()
    since.setMonth(since.getMonth() - 1)

    const [attendance, logs] = await Promise.all([
      prisma.teacherAttendance.findMany({
        where: { teacherId, date: { gte: since } },
        orderBy: { date: 'desc' },
      }),
      prisma.teachingLog.findMany({
        where: { teacherId, date: { gte: since } },
        include: { subject: true, class: true },
        orderBy: { date: 'desc' },
      }),
    ])

    const attendanceStats = {
      total: attendance.length,
      present: attendance.filter(r => r.status === 'PRESENT').length,
      absent: attendance.filter(r => r.status === 'ABSENT').length,
    }

    res.json({ attendance, attendanceStats, logs })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
