import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { authenticate, AuthRequest } from '../middleware/auth'

const router = Router()
const prisma = new PrismaClient()

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

// POST /auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body)

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        student: { include: { class: true } },
        teacher: { include: { classes: true } },
      },
    })

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    )

    const { passwordHash, ...safeUser } = user

    res.json({
      token,
      user: safeUser,
    })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors })
    }
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /auth/me
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        student: { include: { class: true } },
        teacher: { include: { classes: true } },
      },
    })
    if (!user) return res.status(404).json({ error: 'User not found' })
    const { passwordHash, ...safeUser } = user
    res.json(safeUser)
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /auth/logout
router.post('/logout', authenticate, async (req: AuthRequest, res: Response) => {
  res.json({ message: 'Logged out successfully' })
})

// POST /auth/change-password
router.post('/change-password', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both passwords required' })
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' })
    }

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } })
    if (!user) return res.status(404).json({ error: 'User not found' })

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' })

    const newHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash: newHash },
    })

    res.json({ message: 'Password changed successfully' })
  } catch {
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
