# SmartAttend API Documentation

Base URL: `https://your-backend.railway.app/api/v1`

All protected routes require: `Authorization: Bearer <token>`

---

## Authentication

### POST `/auth/login`
```json
// Request
{ "email": "admin@school.edu", "password": "Admin@123" }

// Response
{
  "token": "eyJhbGci...",
  "user": { "id": "...", "name": "...", "role": "ADMIN", "email": "..." }
}
```

### GET `/auth/me`
Returns the current authenticated user with student/teacher relations.

### POST `/auth/logout`
Invalidates the current session.

### POST `/auth/change-password`
```json
{ "currentPassword": "old", "newPassword": "newSecure@123" }
```

---

## Students

### GET `/students`
Query params: `classId`, `search`

### POST `/students` _(Admin only)_
```json
{
  "name": "Aarav Sharma", "email": "aarav@school.edu",
  "classId": "uuid", "rollNumber": "3A01",
  "parentName": "Rajesh Sharma", "parentPhone": "+91-9876543210"
}
```

### GET `/students/:id`

---

## Teachers

### GET `/teachers`

### POST `/teachers` _(Admin only)_
```json
{
  "name": "Sarah Johnson", "email": "sarah@school.edu",
  "employeeId": "EMP0001", "qualification": "B.Ed",
  "specialization": "Mathematics", "phone": "+91-..."
}
```

---

## Classes

### GET `/classes`
Returns classes with teacher info and student count.

### GET `/classes/:id/students`
Returns all students in a class.

---

## Attendance

### GET `/attendance`
Query params: `classId`, `date`, `studentId`

### POST `/attendance/bulk` _(Admin/Teacher)_
```json
{
  "classId": "uuid",
  "date": "2025-04-25",
  "records": [
    {
      "studentId": "uuid",
      "status": "PRESENT",
      "isAiMarked": true,
      "aiConfidence": 0.94,
      "notes": ""
    }
  ]
}
```

### PATCH `/attendance/:id` _(Admin/Teacher)_
```json
{ "status": "LATE", "notes": "Arrived 10 minutes late" }
```

### GET `/attendance/summary/:classId`
Query params: `month` (1-12), `year`

Returns per-student totals for the month.

### POST `/attendance/upload-photo` _(Admin/Teacher)_
Multipart form: `photo` field (image file)
Returns `{ photoUrl: "/uploads/attendance/file.jpg" }`

---

## Teacher Attendance

### GET `/teacher-attendance`
Query params: `teacherId`, `date`, `month`, `year`

### POST `/teacher-attendance/check-in`
Marks teacher as present for today with current time.

### POST `/teacher-attendance/check-out`
Records check-out time for today.

---

## Teaching Logs

### GET `/teaching-logs`
Query params: `teacherId`, `classId`, `date`, `limit`, `offset`

### POST `/teaching-logs` _(Admin/Teacher)_
```json
{
  "classId": "uuid", "subjectId": "uuid",
  "date": "2025-04-25",
  "topicsCovered": "Introduction to Fractions",
  "objectives": "Students will understand numerator/denominator",
  "homework": "Page 45, Q1-10",
  "notes": "Class participated well"
}
```

### PATCH `/teaching-logs/:id`
### DELETE `/teaching-logs/:id` _(Admin only)_

---

## Analytics

### GET `/analytics/dashboard`
Returns school-wide summary, 7-day trend, class stats.

### GET `/analytics/student/:studentId`
Query params: `months` (default: 3)

### GET `/analytics/teacher/:teacherId`

---

## Export

### GET `/export/attendance/csv`
Query params: `classId`, `month`, `year`
Downloads CSV file directly.

### GET `/export/teaching-logs/csv`
Query params: `teacherId`, `month`, `year`

### GET `/export/students/csv` _(Admin only)_

---

## AI Face Recognition Service

Base URL: `http://localhost:8000`

### GET `/health`
Service status and enrolled student count.

### POST `/api/enroll/:student_id`
Multipart: `photo` field
Enrolls a student's face. Can be called up to 5 times per student for better accuracy.

### DELETE `/api/enroll/:student_id`
Removes a student's face data.

### GET `/api/enroll/list`
Lists all enrolled student IDs with sample counts.

### POST `/api/recognize`
Multipart: `photo` field + `class_students` JSON string
```json
// class_students
[
  { "student_id": "uuid", "name": "Aarav Sharma", "roll_number": "3A01" }
]

// Response
{
  "faces_detected": 18,
  "faces_recognized": 16,
  "results": [
    {
      "student_id": "uuid",
      "name": "Aarav Sharma",
      "roll_number": "3A01",
      "status": "PRESENT",
      "recognized": true,
      "confidence": 0.94
    }
  ]
}
```

### GET `/api/recognize/status`
Returns enrollment readiness info.
