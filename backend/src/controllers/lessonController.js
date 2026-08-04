const prisma = require('../prisma/client');
const { calculatePrice } = require('../utils/pricing')
const {
  assertWithinWorkingHours,
  assertNotPastDate,
  assertInstructorAvailable,
  assertInstructorBelongsToSchool
} = require('../utils/scheduleValidation')

// Δημιουργία Μαθήματος (από Σχολή)
const createLesson = async (req, res, next) => {
  const { date, startTime, duration, sport, level, instructorId, customerName, customerPhone, persons = 1 } = req.body;

  try {
    assertWithinWorkingHours(startTime, duration)
    assertNotPastDate(date)
    await assertInstructorBelongsToSchool(prisma, instructorId, req.user.id)
    await assertInstructorAvailable(prisma, { instructorId, date, startTime, duration })

    const lesson = await prisma.lesson.create({
      data: {
        date: new Date(date),
        startTime,
        duration,
        sport,
        level,
        price: calculatePrice(persons, duration),
        type: persons > 1 ? 'group' : 'individual',
        persons,
        status: instructorId ? 'confirmed' : 'pending',
        schoolId: req.user.id,
        instructorId: instructorId || null,
        bookings: {
          create: {
            customerName,
            customerPhone,
            status: instructorId ? 'confirmed' : 'pending'
          }
        }
      },
      include: {
        instructor: { select: { id: true, name: true } },
        bookings: true
      }
    })

    res.status(201).json(lesson);
  } catch (error) {
    next(error)
  }
};

// Λίστα μαθημάτων σχολής
const getLessons = async (req, res, next) => {
  try {
    const lessons = await prisma.lesson.findMany({
      where: { schoolId: req.user.id },
      include: {
        instructor: { select: { id: true, name: true, specialty: true } },
        bookings: {
          include: { review: true }
        }
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    })
    res.json(lessons)
  } catch (error) {
    next(error)
  }
}

// Διαγραφή μαθήματος
const deleteLesson = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, schoolId: req.user.id }
    });

    if (!lesson) {
      return res.status(404).json({ error: 'Το μάθημα δεν βρέθηκε' });
    }

    await prisma.booking.deleteMany({ where: { lessonId: req.params.id } });
    await prisma.lesson.delete({ where: { id: req.params.id } });

    res.json({ message: 'Το μάθημα διαγράφηκε επιτυχώς' });
  } catch (error) {
    next(error)
  }
};

// Επεξεργασία μαθήματος
const updateLesson = async (req, res, next) => {
  const { date, startTime, duration, sport, level, customerName, customerPhone, persons } = req.body
  const instructorId = req.body.instructorId || null

  try {
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, schoolId: req.user.id }
    })

    if (!lesson) {
      return res.status(404).json({ error: 'Το μάθημα δεν βρέθηκε' })
    }

    assertNotPastDate(date)
    assertWithinWorkingHours(startTime, duration)
    await assertInstructorBelongsToSchool(prisma, instructorId, req.user.id)
    await assertInstructorAvailable(prisma, {
      instructorId,
      date,
      startTime,
      duration,
      excludeLessonId: req.params.id
    })

    const effectivePersons = persons ?? lesson.persons

    const updated = await prisma.lesson.update({
      where: { id: req.params.id },
      data: {
        date: new Date(date),
        startTime,
        duration,
        sport,
        level,
        persons: effectivePersons,
        price: calculatePrice(effectivePersons, duration),
        status: lesson.status === 'cancelled'
          ? 'cancelled'
          : instructorId ? 'confirmed' : 'pending',
        instructorId,
        bookings: {
          updateMany: {
            where: { lessonId: req.params.id },
            data: {
              customerName,
              customerPhone,
              status: lesson.status === 'cancelled'
                ? 'cancelled'
                : instructorId ? 'confirmed' : 'pending'
            }
          }
        }
      },
      include: {
        instructor: { select: { id: true, name: true } },
        bookings: true
      }
    })

    res.json(updated)
  } catch (error) {
    next(error)
  }
}
// Συγχρονισμός status μαθήματος με βάση τις ενεργές κρατήσεις
const syncLessonStatus = async (lessonId) => {
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
  if (!lesson) return

  const activeBookings = await prisma.booking.count({
    where: { lessonId, status: { not: 'cancelled' } }
  })

  const data = {}

  if (lesson.type === 'open_group') {
    data.persons = activeBookings
    if (activeBookings === 0) {
      data.status = 'cancelled'
    } else {
      // Επιβεβαιώνεται ΜΟΝΟ αν: μαζεύτηκε το min ΚΑΙ έχει οριστεί ώρα + εκπαιδευτής
      const ready = activeBookings >= lesson.minPersons && lesson.startTime && lesson.instructorId
      data.status = ready ? 'confirmed' : 'pending'
    }
  } else if (activeBookings === 0) {
    data.status = 'cancelled'
  }

  if (Object.keys(data).length) {
    await prisma.lesson.update({ where: { id: lessonId }, data })
  }
}

// Ακύρωση κράτησης
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id },
      include: { lesson: true }
    })

    if (!booking) {
      return res.status(404).json({ error: 'Η κράτηση δεν βρέθηκε' })
    }

    if (booking.lesson.schoolId !== req.user.id) {
      return res.status(403).json({ error: 'Δεν έχεις πρόσβαση' })
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' }
    })

    await syncLessonStatus(booking.lessonId)

    res.json(updated)
  } catch (error) {
    next(error)
  }
}

// Ανάθεση εκπαιδευτή σε pending μάθημα
const assignInstructor = async (req, res, next) => {
  const { instructorId } = req.body

  try {
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, schoolId: req.user.id }
    })

    if (!lesson) {
      return res.status(404).json({ error: 'Το μάθημα δεν βρέθηκε' })
    }

    if (lesson.status !== 'pending') {
      return res.status(400).json({ error: 'Το μάθημα δεν είναι σε κατάσταση αναμονής' })
    }

    await assertInstructorBelongsToSchool(prisma, instructorId, req.user.id)
    await assertInstructorAvailable(prisma, {
      instructorId,
      date: lesson.date,
      startTime: lesson.startTime,
      duration: lesson.duration,
      excludeLessonId: req.params.id
    })

    const updated = await prisma.lesson.update({
      where: { id: req.params.id },
      data: {
        instructorId,
        status: 'confirmed',
        bookings: {
          updateMany: {
            where: { lessonId: req.params.id },
            data: { status: 'confirmed' }
          }
        }
      },
      include: {
        instructor: { select: { id: true, name: true } },
        bookings: true
      }
    })

    res.json(updated)
  } catch (error) {
    next(error)
  }
}
// Δημιουργία Open Ομαδικού Μαθήματος (από Σχολή) — χωρίς ώρα/εκπαιδευτή αρχικά
const createOpenGroupLesson = async (req, res, next) => {
  const { date, duration, sport, level } = req.body

  try {
    assertNotPastDate(date)

    const price = 20 * duration

    const lesson = await prisma.lesson.create({
      data: {
        date: new Date(date),
        startTime: null,
        duration,
        sport,
        level,
        price,
        type: 'open_group',
        persons: 0,
        maxPersons: 10,
        minPersons: 4,
        status: 'pending',
        school: { connect: { id: req.user.id } },
      },
      include: {
        instructor: { select: { id: true, name: true } },
        bookings: true
      }
    })

    res.status(201).json(lesson)
  } catch (error) {
    next(error)
  }
}

// Μετακίνηση μαθήματος (drag & drop): νέος εκπαιδευτής + νέα ώρα
const moveLesson = async (req, res, next) => {
  const { instructorId, startTime } = req.body

  try {
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, schoolId: req.user.id },
      include: { bookings: true }
    })

    if (!lesson) {
      return res.status(404).json({ error: 'Το μάθημα δεν βρέθηκε' })
    }

    const dateStr = new Date(lesson.date).toISOString().split('T')[0]

    // Έλεγχος ωραρίου
    assertWithinWorkingHours(startTime, lesson.duration)

    // Έλεγχος ότι ο εκπαιδευτής ανήκει στη σχολή
    await assertInstructorBelongsToSchool(prisma, instructorId, req.user.id)

    // Έλεγχος ειδικότητας
    const instructor = await prisma.instructor.findUnique({ where: { id: instructorId } })
    if (!instructor.specialty.includes(lesson.sport)) {
      const sportLabel = lesson.sport === 'ski' ? 'σκι' : 'snowboard'
      return res.status(400).json({ error: `Ο εκπαιδευτής ${instructor.name} δεν διδάσκει ${sportLabel}` })
    }

    // Έλεγχος διαθεσιμότητας (overlap)
    await assertInstructorAvailable(prisma, {
      instructorId,
      date: dateStr,
      startTime,
      duration: lesson.duration,
      excludeLessonId: req.params.id
    })

    const updated = await prisma.lesson.update({
      where: { id: req.params.id },
      data: {
        startTime,
        instructorId,
        status: lesson.status === 'cancelled'
          ? 'cancelled'
          : lesson.type === 'open_group'
            ? (lesson.bookings.filter(b => b.status !== 'cancelled').length >= lesson.minPersons ? 'confirmed' : 'pending')
            : 'confirmed',
        bookings: {
          updateMany: {
            where: { lessonId: req.params.id, status: { not: 'cancelled' } },
            data: { status: 'confirmed' }
          }
        }
      },
      include: {
        instructor: { select: { id: true, name: true } },
        bookings: true
      }
    })

    res.json(updated)
  } catch (error) {
    next(error)
  }
}

// Κλείδωμα ανοιχτού ομαδικού: ορισμός ώρας + εκπαιδευτή (από σχολή)
const lockOpenGroup = async (req, res, next) => {
  const { startTime, instructorId } = req.body

  try {
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, schoolId: req.user.id },
      include: { bookings: { where: { status: { not: 'cancelled' } } } }
    })

    if (!lesson) {
      return res.status(404).json({ error: 'Το μάθημα δεν βρέθηκε' })
    }

    if (lesson.type !== 'open_group') {
      return res.status(400).json({ error: 'Μόνο ανοιχτά ομαδικά μπορούν να κλειδωθούν' })
    }

    const dateStr = new Date(lesson.date).toISOString().split('T')[0]

    // Validation
    assertWithinWorkingHours(startTime, lesson.duration)
    await assertInstructorBelongsToSchool(prisma, instructorId, req.user.id)

    // Έλεγχος ειδικότητας
    const instructor = await prisma.instructor.findUnique({ where: { id: instructorId } })
    if (!instructor.specialty.includes(lesson.sport)) {
      const sportLabel = lesson.sport === 'ski' ? 'σκι' : 'snowboard'
      return res.status(400).json({ error: `Ο εκπαιδευτής ${instructor.name} δεν διδάσκει ${sportLabel}` })
    }

    // Έλεγχος διαθεσιμότητας
    await assertInstructorAvailable(prisma, {
      instructorId,
      date: dateStr,
      startTime,
      duration: lesson.duration,
      excludeLessonId: req.params.id
    })

    const activeBookings = lesson.bookings.length
    const reachedMin = activeBookings >= lesson.minPersons

    const updated = await prisma.lesson.update({
      where: { id: req.params.id },
      data: {
        startTime,
        instructorId,
        status: reachedMin ? 'confirmed' : 'pending',
        bookings: {
          updateMany: {
            where: { lessonId: req.params.id, status: { not: 'cancelled' } },
            data: { status: reachedMin ? 'confirmed' : 'pending' }
          }
        }
      },
      include: {
        instructor: { select: { id: true, name: true } },
        bookings: true
      }
    })

    res.json(updated)
  } catch (error) {
    next(error)
  }
}

// Αυτόματο κλείδωμα ώρας ομαδικού αν ≥ min άτομα προτιμούν κοινή ώρα
const autoLockOpenGroupTime = async (lessonId) => {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { bookings: { where: { status: { not: 'cancelled' } } } }
  })

  if (!lesson || lesson.type !== 'open_group') return
  if (lesson.startTime) return // έχει ήδη ώρα, δεν κάνουμε τίποτα

  const activeBookings = lesson.bookings
  if (activeBookings.length < lesson.minPersons) return // δεν έφτασε το min ακόμα

  // Μέτρα πόσοι προτιμούν κάθε ώρα
  const maxStart = 16 - lesson.duration
  const hourVotes = {}
  for (let h = 9; h <= maxStart; h++) hourVotes[h] = 0

  activeBookings.forEach(b => {
    (b.preferredHours || []).forEach(h => {
      if (hourVotes[h] !== undefined) hourVotes[h]++
    })
  })

  // Βρες ώρες με ≥ min ψήφους, διάλεξε τη νωρίτερη
  const qualifyingHours = Object.keys(hourVotes)
    .map(Number)
    .filter(h => hourVotes[h] >= lesson.minPersons)
    .sort((a, b) => a - b) // αύξουσα → νωρίτερη πρώτη

  if (qualifyingHours.length === 0) return // καμία ώρα δεν συγκεντρώνει το min

  const lockedHour = qualifyingHours[0]
  const startTime = `${lockedHour.toString().padStart(2, '0')}:00`

  // Κλείδωσε την ώρα (αλλά ΟΧΙ εκπαιδευτή — μένει pending μέχρι ανάθεση)
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { startTime }
  })
}

// Αφαίρεση εκπαιδευτή από μάθημα (grid → pending panel)
const unassignInstructor = async (req, res, next) => {
  try {
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, schoolId: req.user.id }
    })

    if (!lesson) {
      return res.status(404).json({ error: 'Το μάθημα δεν βρέθηκε' })
    }

    const updated = await prisma.lesson.update({
      where: { id: req.params.id },
      data: {
        instructorId: null,
        status: 'pending',
        bookings: {
          updateMany: {
            where: { lessonId: req.params.id, status: { not: 'cancelled' } },
            data: { status: 'pending' }
          }
        }
      },
      include: {
        instructor: { select: { id: true, name: true } },
        bookings: true
      }
    })

    res.json(updated)
  } catch (error) {
    next(error)
  }
}

module.exports = {
  createLesson,
  getLessons,
  deleteLesson,
  updateLesson,
  cancelBooking,
  assignInstructor,
  createOpenGroupLesson,
  syncLessonStatus,
  moveLesson,
  lockOpenGroup,
  autoLockOpenGroupTime,
  unassignInstructor
}
