const prisma = require('../prisma/client');
const { calculatePrice } = require('../utils/pricing')

// Βοηθητική συνάρτηση - μετατροπή ώρας σε λεπτά
const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

// Δημιουργία Μαθήματος (από Σχολή)
const createLesson = async (req, res) => {
  const { date, startTime, duration, sport, level, price, instructorId, customerName, customerPhone, persons = 1 } = req.body;

  try {
    // Έλεγχος ώρας έναρξης (09:00 - 16:00)
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = startMinutes + duration * 60;

    if (startMinutes < timeToMinutes('09:00') || endMinutes > timeToMinutes('16:00')) {
      return res.status(400).json({ error: 'Το μάθημα πρέπει να είναι μεταξύ 09:00 και 16:00' });
    }

    // Έλεγχος αν η ημερομηνία είναι στο παρελθόν
    const lessonDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (lessonDate < today) {
      return res.status(400).json({ error: 'Δεν μπορείς να κλείσεις μάθημα σε παρελθοντική ημερομηνία' })
    }

    // Έλεγχος αν ο εκπαιδευτής ανήκει στη σχολή (μόνο αν έχει επιλεγεί)
    if (instructorId) {
      const instructor = await prisma.instructor.findFirst({
        where: { id: instructorId, schoolId: req.user.id }
      })

      if (!instructor) {
        return res.status(403).json({ error: 'Ο εκπαιδευτής δεν ανήκει στη σχολή σου' })
      }
    }

    // Βρες όλα τα μαθήματα του εκπαιδευτή την ίδια μέρα
    // εξαιρώντας αυτά με ακυρωμένες κρατήσεις
    const existingLessons = instructorId ? await prisma.lesson.findMany({
      where: {
        instructorId,
        date: new Date(date),
        bookings: {
          some: { status: 'confirmed' }
        }
      }
    }) : []

    // Έλεγχος επικάλυψης ωρών
    for (const lesson of existingLessons) {
      const existingStart = timeToMinutes(lesson.startTime);
      const existingEnd = existingStart + lesson.duration * 60;

      if (startMinutes < existingEnd && endMinutes > existingStart) {
        return res.status(400).json({
          error: `Ο εκπαιδευτής έχει ήδη μάθημα από ${lesson.startTime} για ${lesson.duration} ώρες`
        });
      }
    }

    // Έλεγχος συνολικών ωρών την ίδια μέρα (max 7)
    const totalHours = existingLessons.reduce((sum, l) => sum + l.duration, 0);
    if (totalHours + duration > 7) {
      return res.status(400).json({
        error: `Ο εκπαιδευτής έχει ήδη ${totalHours} ώρες σήμερα. Δεν μπορεί να προστεθούν ${duration} ώρες`
      });
    }

    // Δημιουργία μαθήματος
    const lesson = await prisma.lesson.create({
      data: {
        date: new Date(date),
        startTime,
        duration,
        sport,
        level,
        price: calculatePrice(persons || 1, duration),
        type: persons > 1 ? 'group' : 'individual',
        persons: persons || 1,
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
    res.status(500).json({ error: error.message });
  }
};

// Λίστα μαθημάτων σχολής
const getLessons = async (req, res) => {
  try {
    const lessons = await prisma.lesson.findMany({
      where: { schoolId: req.user.id },
      include: {
        instructor: { select: { id: true, name: true, specialty: true } },
        bookings: true
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
    });
    res.json(lessons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Διαγραφή μαθήματος
const deleteLesson = async (req, res) => {
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
    res.status(500).json({ error: error.message });
  }
};

// Επεξεργασία μαθήματος
const updateLesson = async (req, res) => {
  const { date, startTime, duration, sport, level, price, customerName, customerPhone } = req.body
  const instructorId = req.body.instructorId || null

  try {
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, schoolId: req.user.id }
    })

    if (!lesson) {
      return res.status(404).json({ error: 'Το μάθημα δεν βρέθηκε' })
    }

    // Έλεγχος ημερομηνίας
    const lessonDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (lessonDate < today) {
      return res.status(400).json({ error: 'Δεν μπορείς να ορίσεις παρελθοντική ημερομηνία' })
    }

    // Έλεγχος ωραρίου
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }

    const startMinutes = timeToMinutes(startTime)
    const endMinutes = startMinutes + duration * 60

    if (startMinutes < timeToMinutes('09:00') || endMinutes > timeToMinutes('16:00')) {
      return res.status(400).json({ error: 'Το μάθημα πρέπει να είναι μεταξύ 09:00 και 16:00' })
    }

    const existingLessons = await prisma.lesson.findMany({
      where: {
        instructorId,
        date: new Date(date),
        id: { not: req.params.id },
        bookings: {
          some: {
            status: 'confirmed'
          }
        }
      }
    })

    for (const l of existingLessons) {
      const existingStart = timeToMinutes(l.startTime)
      const existingEnd = existingStart + l.duration * 60
      if (startMinutes < existingEnd && endMinutes > existingStart) {
        return res.status(400).json({ error: `Ο εκπαιδευτής έχει ήδη μάθημα από ${l.startTime} για ${l.duration} ώρες` })
      }
    }

    // Έλεγχος 7 ωρών
    const totalHours = existingLessons.reduce((sum, l) => sum + l.duration, 0)
    if (totalHours + duration > 7) {
      return res.status(400).json({ error: `Ο εκπαιδευτής υπερβαίνει τις 7 ώρες` })
    }

    // Ενημέρωση μαθήματος
    const updated = await prisma.lesson.update({
      where: { id: req.params.id },
      data: {
        date: new Date(date),
        startTime,
        duration,
        sport,
        level,
        price: duration * 50,
        status: lesson.status === 'cancelled' ? 'cancelled' : instructorId ? 'confirmed' : 'pending',
        instructorId: instructorId || null,
        bookings: {
          updateMany: {
            where: { lessonId: req.params.id },
            data: {
              customerName,
              customerPhone,
              status: lesson.status === 'cancelled' ? 'cancelled' : instructorId ? 'confirmed' : 'pending'
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
    res.status(500).json({ error: error.message })
  }
}

// Ακύρωση κράτησης
const cancelBooking = async (req, res) => {
  try {
    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id },
      include: { lesson: true }
    })

    if (!booking) {
      return res.status(404).json({ error: 'Η κράτηση δεν βρέθηκε' })
    }

    // Έλεγχος αν ανήκει στη σχολή
    if (booking.lesson.schoolId !== req.user.id) {
      return res.status(403).json({ error: 'Δεν έχεις πρόσβαση' })
    }

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { status: 'cancelled' }
    })

    // Αλλαγή status του lesson σε cancelled
    await prisma.lesson.update({
      where: { id: booking.lessonId },
      data: { status: 'cancelled' }
    })

    res.json(updated)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Ανάθεση εκπαιδευτή σε pending μάθημα
const assignInstructor = async (req, res) => {
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

    // Έλεγχος αν ο εκπαιδευτής ανήκει στη σχολή
    const instructor = await prisma.instructor.findFirst({
      where: { id: instructorId, schoolId: req.user.id }
    })

    if (!instructor) {
      return res.status(403).json({ error: 'Ο εκπαιδευτής δεν ανήκει στη σχολή σου' })
    }

    // Έλεγχος επικάλυψης ωρών
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }

    const startMinutes = timeToMinutes(lesson.startTime)
    const endMinutes = startMinutes + lesson.duration * 60

    const existingLessons = await prisma.lesson.findMany({
      where: {
        instructorId,
        date: lesson.date,
        status: { not: 'cancelled' },
        id: { not: req.params.id }
      }
    })

    for (const l of existingLessons) {
      const existingStart = timeToMinutes(l.startTime)
      const existingEnd = existingStart + l.duration * 60
      if (startMinutes < existingEnd && endMinutes > existingStart) {
        return res.status(400).json({ error: `Ο εκπαιδευτής έχει ήδη μάθημα από ${l.startTime} για ${l.duration} ώρες` })
      }
    }

    // Ανάθεση εκπαιδευτή και αλλαγή status
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
    res.status(500).json({ error: error.message })
  }
}

// Δημιουργία Open Ομαδικού Μαθήματος (από Σχολή)
const createOpenGroupLesson = async (req, res) => {
  const { date, startTime, duration, sport, level, instructorId } = req.body

  try {
    // Έλεγχος ημερομηνίας
    const lessonDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (lessonDate < today) {
      return res.status(400).json({ error: 'Δεν μπορείς να ορίσεις παρελθοντική ημερομηνία' })
    }

    // Έλεγχος ωραρίου
    const timeToMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours * 60 + minutes
    }

    const startMinutes = timeToMinutes(startTime)
    const endMinutes = startMinutes + duration * 60

    if (startMinutes < timeToMinutes('09:00') || endMinutes > timeToMinutes('16:00')) {
      return res.status(400).json({ error: 'Το μάθημα πρέπει να είναι μεταξύ 09:00 και 16:00' })
    }

    // Έλεγχος εκπαιδευτή
    if (instructorId) {
      const instructor = await prisma.instructor.findFirst({
        where: { id: instructorId, schoolId: req.user.id }
      })
      if (!instructor) {
        return res.status(403).json({ error: 'Ο εκπαιδευτής δεν ανήκει στη σχολή σου' })
      }

      // Έλεγχος επικάλυψης
      const existingLessons = await prisma.lesson.findMany({
        where: {
          instructorId,
          date: new Date(date),
          status: { not: 'cancelled' }
        }
      })

      for (const l of existingLessons) {
        const existingStart = timeToMinutes(l.startTime)
        const existingEnd = existingStart + l.duration * 60
        if (startMinutes < existingEnd && endMinutes > existingStart) {
          return res.status(400).json({ error: `Ο εκπαιδευτής έχει ήδη μάθημα από ${l.startTime} για ${l.duration} ώρες` })
        }
      }
    }

    // Τιμή βάσει 1 ατόμου (20€/ώρα)
    const price = 20 * duration

    const lesson = await prisma.lesson.create({
      data: {
        date: new Date(date),
        startTime,
        duration,
        sport,
        level,
        price,
        type: 'open_group',
        persons: 0,
        maxPersons: 10,
        minPersons: 4,
        status: 'pending',
        schoolId: req.user.id,
        instructorId: instructorId || null,
      },
      include: {
        instructor: { select: { id: true, name: true } },
        bookings: true
      }
    })

    res.status(201).json(lesson)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

module.exports = { createLesson, getLessons, deleteLesson, updateLesson, cancelBooking, assignInstructor, createOpenGroupLesson }

