class ValidationError extends Error {
  constructor(message, status = 400) {
    super(message)
    this.status = status
    this.name = 'ValidationError'
  }
}

const DAY_START = 9 * 60   // 09:00
const DAY_END = 16 * 60    // 16:00
const MAX_DAILY_HOURS = 7

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const assertWithinWorkingHours = (startTime, duration) => {
  const startMinutes = timeToMinutes(startTime)
  const endMinutes = startMinutes + duration * 60
  if (startMinutes < DAY_START || endMinutes > DAY_END) {
    throw new ValidationError('Το μάθημα πρέπει να είναι μεταξύ 09:00 και 16:00')
  }
}

const assertNotPastDate = (date) => {
  const lessonDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (lessonDate < today) {
    throw new ValidationError('Δεν μπορείς να κλείσεις μάθημα σε παρελθοντική ημερομηνία')
  }
}

const assertInstructorAvailable = async (prisma, { instructorId, date, startTime, duration, excludeLessonId }) => {
  if (!instructorId) return

  const where = {
    instructorId,
    date: new Date(date),
    status: { not: 'cancelled' }
  }
  if (excludeLessonId) where.id = { not: excludeLessonId }

  const existingLessons = await prisma.lesson.findMany({ where })

  const startMinutes = timeToMinutes(startTime)
  const endMinutes = startMinutes + duration * 60

  for (const l of existingLessons) {
    const existingStart = timeToMinutes(l.startTime)
    const existingEnd = existingStart + l.duration * 60
    if (startMinutes < existingEnd && endMinutes > existingStart) {
      throw new ValidationError(
        `Ο εκπαιδευτής έχει ήδη μάθημα από ${l.startTime} για ${l.duration} ώρες`
      )
    }
  }

  const totalHours = existingLessons.reduce((sum, l) => sum + l.duration, 0)
  if (totalHours + duration > MAX_DAILY_HOURS) {
    throw new ValidationError(
      `Ο εκπαιδευτής έχει ήδη ${totalHours} ώρες σήμερα. Δεν μπορεί να προστεθούν ${duration} ώρες`
    )
  }
}

const assertInstructorBelongsToSchool = async (prisma, instructorId, schoolId) => {
  if (!instructorId) return
  const instructor = await prisma.instructor.findFirst({
    where: { id: instructorId, schoolId }
  })
  if (!instructor) {
    throw new ValidationError('Ο εκπαιδευτής δεν ανήκει στη σχολή σου', 403)
  }
}

module.exports = {
  ValidationError,
  timeToMinutes,
  assertWithinWorkingHours,
  assertNotPastDate,
  assertInstructorAvailable,
  assertInstructorBelongsToSchool
}
