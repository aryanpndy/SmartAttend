import { PrismaClient, Role, AttendanceStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clean up
  await prisma.attendance.deleteMany()
  await prisma.teachingLog.deleteMany()
  await prisma.teacherAttendance.deleteMany()
  await prisma.student.deleteMany()
  await prisma.teacher.deleteMany()
  await prisma.class.deleteMany()
  await prisma.subject.deleteMany()
  await prisma.session.deleteMany()
  await prisma.user.deleteMany()

  const hash = (pw: string) => bcrypt.hashSync(pw, 10)

  // ── Subjects ──────────────────────────────────────────────────────────────
  const subjects = await prisma.subject.createMany({
    data: [
      { name: 'Mathematics', code: 'MATH' },
      { name: 'English', code: 'ENG' },
      { name: 'Science', code: 'SCI' },
      { name: 'Social Studies', code: 'SS' },
      { name: 'Hindi', code: 'HIN' },
      { name: 'Computer Science', code: 'CS' },
      { name: 'Physical Education', code: 'PE' },
      { name: 'Art & Craft', code: 'ART' },
    ],
  })
  console.log('✅ Subjects created')

  // ── Admin ─────────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@school.edu',
      name: 'Principal Sharma',
      passwordHash: hash('Admin@123'),
      role: Role.ADMIN,
      phone: '+91-9876543210',
    },
  })
  console.log('✅ Admin created:', adminUser.email)

  // ── Teachers ──────────────────────────────────────────────────────────────
  const teacherData = [
    { name: 'Sarah Johnson', email: 'sarah.johnson@school.edu', spec: 'Mathematics' },
    { name: 'Raj Patel', email: 'raj.patel@school.edu', spec: 'Science' },
    { name: 'Priya Mehta', email: 'priya.mehta@school.edu', spec: 'English' },
    { name: 'Amit Kumar', email: 'amit.kumar@school.edu', spec: 'Social Studies' },
  ]

  const teachers = []
  for (let i = 0; i < teacherData.length; i++) {
    const t = teacherData[i]
    const user = await prisma.user.create({
      data: {
        email: t.email,
        name: t.name,
        passwordHash: hash('Teacher@123'),
        role: Role.TEACHER,
        teacher: {
          create: {
            employeeId: `EMP${String(i + 1).padStart(4, '0')}`,
            qualification: 'B.Ed, M.Sc',
            specialization: t.spec,
          },
        },
      },
      include: { teacher: true },
    })
    teachers.push(user)
  }
  console.log(`✅ ${teachers.length} teachers created`)

  // ── Classes ───────────────────────────────────────────────────────────────
  const classData = [
    { name: 'Grade 3-A', grade: 3, section: 'A', room: '301', teacherIdx: 0 },
    { name: 'Grade 3-B', grade: 3, section: 'B', room: '302', teacherIdx: 1 },
    { name: 'Grade 4-A', grade: 4, section: 'A', room: '401', teacherIdx: 2 },
    { name: 'Grade 5-A', grade: 5, section: 'A', room: '501', teacherIdx: 3 },
  ]

  const classes = []
  for (const c of classData) {
    const cls = await prisma.class.create({
      data: {
        name: c.name,
        grade: c.grade,
        section: c.section,
        room: c.room,
        capacity: 35,
        teacherId: teachers[c.teacherIdx].teacher!.id,
      },
    })
    classes.push(cls)
  }
  console.log(`✅ ${classes.length} classes created`)

  // ── Students ──────────────────────────────────────────────────────────────
  const studentNames = [
    'Aarav Sharma', 'Diya Patel', 'Arjun Singh', 'Ananya Gupta',
    'Vivaan Joshi', 'Kavya Reddy', 'Aditya Nair', 'Ishaan Verma',
    'Myra Kapoor', 'Rohan Mehta', 'Siya Iyer', 'Dev Chauhan',
    'Nisha Agarwal', 'Karan Malhotra', 'Riya Desai', 'Yash Bose',
    'Pooja Tiwari', 'Rahul Saxena', 'Simran Bhatt', 'Akash Rao',
  ]

  const students = []
  for (let i = 0; i < studentNames.length; i++) {
    const cls = classes[i % classes.length]
    const email = studentNames[i].toLowerCase().replace(/\s+/g, '.') + '@student.school.edu'
    const user = await prisma.user.create({
      data: {
        email,
        name: studentNames[i],
        passwordHash: hash('Student@123'),
        role: Role.STUDENT,
        student: {
          create: {
            rollNumber: `${cls.grade}${cls.section}${String(Math.floor(i / 4) + 1).padStart(2, '0')}`,
            classId: cls.id,
            parentName: `Parent of ${studentNames[i]}`,
            parentPhone: `+91-98765${String(43210 + i)}`,
          },
        },
      },
      include: { student: true },
    })
    students.push(user)
  }
  console.log(`✅ ${students.length} students created`)

  // ── Sample Attendance (last 7 days) ────────────────────────────────────────
  const today = new Date()
  let attendanceCount = 0
  for (let d = 6; d >= 0; d--) {
    const date = new Date(today)
    date.setDate(today.getDate() - d)
    if (date.getDay() === 0 || date.getDay() === 6) continue // skip weekends

    for (const studentUser of students) {
      const student = studentUser.student!
      const rand = Math.random()
      const status = rand > 0.15 ? AttendanceStatus.PRESENT :
        rand > 0.05 ? AttendanceStatus.ABSENT : AttendanceStatus.LATE

      await prisma.attendance.create({
        data: {
          studentId: student.id,
          classId: student.classId,
          date,
          status,
          isAiMarked: Math.random() > 0.5,
          aiConfidence: Math.random() * 0.3 + 0.7,
          markedBy: teachers[0].id,
        },
      })
      attendanceCount++
    }
  }
  console.log(`✅ ${attendanceCount} attendance records created`)

  // ── Teaching Logs (last 5 days) ───────────────────────────────────────────
  const mathSubject = await prisma.subject.findFirst({ where: { code: 'MATH' } })
  const sciSubject = await prisma.subject.findFirst({ where: { code: 'SCI' } })
  const engSubject = await prisma.subject.findFirst({ where: { code: 'ENG' } })

  const topicPool = [
    ['Addition and Subtraction', 'Multiplication Tables', 'Division Basics', 'Fractions Introduction'],
    ['States of Matter', 'Photosynthesis', 'Solar System', 'Food Chain'],
    ['Nouns and Pronouns', 'Tense Forms', 'Reading Comprehension', 'Essay Writing'],
  ]

  for (let d = 4; d >= 0; d--) {
    const date = new Date(today)
    date.setDate(today.getDate() - d)
    if (date.getDay() === 0 || date.getDay() === 6) continue

    const subjectPairs = [
      { teacher: teachers[0], class: classes[0], subject: mathSubject!, topics: topicPool[0] },
      { teacher: teachers[1], class: classes[1], subject: sciSubject!, topics: topicPool[1] },
      { teacher: teachers[2], class: classes[2], subject: engSubject!, topics: topicPool[2] },
    ]

    for (const pair of subjectPairs) {
      await prisma.teachingLog.create({
        data: {
          teacherId: pair.teacher.teacher!.id,
          classId: pair.class.id,
          subjectId: pair.subject.id,
          date,
          topicsCovered: pair.topics[d % pair.topics.length],
          objectives: 'Students will understand and apply the concept covered today.',
          homework: 'Complete exercises 1-5 from the textbook.',
          notes: 'Class was engaged and participated well.',
        },
      })
    }
  }
  console.log('✅ Teaching logs created')

  // ── Teacher Attendance ─────────────────────────────────────────────────────
  for (const t of teachers) {
    for (let d = 6; d >= 0; d--) {
      const date = new Date(today)
      date.setDate(today.getDate() - d)
      if (date.getDay() === 0 || date.getDay() === 6) continue

      const timeIn = new Date(date)
      timeIn.setHours(8, Math.floor(Math.random() * 30), 0)
      const timeOut = new Date(date)
      timeOut.setHours(15, Math.floor(Math.random() * 30) + 30, 0)

      await prisma.teacherAttendance.create({
        data: {
          teacherId: t.teacher!.id,
          date,
          timeIn,
          timeOut,
          status: Math.random() > 0.05 ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
        },
      })
    }
  }
  console.log('✅ Teacher attendance created')

  console.log('\n🎉 Database seeded successfully!')
  console.log('\n📋 Login Credentials:')
  console.log('  Admin:   admin@school.edu        / Admin@123')
  console.log('  Teacher: sarah.johnson@school.edu / Teacher@123')
  console.log('  Student: aarav.sharma@student.school.edu / Student@123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
