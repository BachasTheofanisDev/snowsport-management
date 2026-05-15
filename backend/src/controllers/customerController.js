const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../prisma/client')
const { calculatePrice } = require('../utils/pricing')
const {
  assertWithinWorkingHours,
  assertNotPastDate,
  assertInstructorAvailable
} = require('../utils/scheduleValidation')
const { syncLessonStatus } = require('./lessonController')

// Εγγραφή πελάτη
const register = async (req, res, next) => {
    const { name, email, password, phone } = req.body

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Όνομα, email και κωδικός είναι υποχρεωτικά' })
    }

    try {
        const existing = await prisma.customer.findUnique({ where: { email } })
        if (existing) {
            return res.status(400).json({ error: 'Υπάρχει ήδη χρήστης με αυτό το email' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const customer = await prisma.customer.create({
            data: { name, email, password: hashedPassword, phone }
        })

        const token = jwt.sign(
            { id: customer.id, email: customer.email, role: 'customer' },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        )

        const { password: _, ...customerWithoutPassword } = customer
        res.status(201).json({ token, user: customerWithoutPassword, role: 'customer' })
    } catch (error) {
        next(error)
    }
}

// Διαθέσιμες ώρες εκπαιδευτή για μια ημερομηνία
const getAvailableSlots = async (req, res, next) => {
    const { date, schoolId } = req.query

    try {
        const instructors = await prisma.instructor.findMany({
            where: { schoolId },
            select: { id: true, name: true, specialty: true }
        })

        if (instructors.length === 0) return res.json([])

        const lessons = await prisma.lesson.findMany({
            where: {
                instructorId: { in: instructors.map(i => i.id) },
                date: new Date(date),
                status: { not: 'cancelled' }
            },
            select: { instructorId: true, startTime: true, duration: true }
        })

        const lessonsByInstructor = new Map()
        for (const l of lessons) {
            if (!lessonsByInstructor.has(l.instructorId)) {
                lessonsByInstructor.set(l.instructorId, [])
            }
            lessonsByInstructor.get(l.instructorId).push(l)
        }

        const allHours = [9, 10, 11, 12, 13, 14, 15]

        const result = instructors.map(instructor => {
            const instructorLessons = lessonsByInstructor.get(instructor.id) || []
            const bookedHours = []
            for (const lesson of instructorLessons) {
                const start = parseInt(lesson.startTime.split(':')[0])
                for (let i = 0; i < lesson.duration; i++) {
                    bookedHours.push(start + i)
                }
            }
            const availableHours = allHours.filter(h => !bookedHours.includes(h))
            return { ...instructor, bookedHours, availableHours }
        })

        res.json(result)
    } catch (error) {
        next(error)
    }
}

// Κράτηση μαθήματος (με login)
const bookLesson = async (req, res, next) => {
    const { lessonId, isOpenGroup, date, startTime, duration, sport, level, schoolId, instructorId, persons = 1 } = req.body

    try {
        // Join σε υπάρχον open group
        if (isOpenGroup && lessonId) {
            const lesson = await prisma.lesson.findUnique({
                where: { id: lessonId },
                include: { bookings: { where: { status: { not: 'cancelled' } } } }
            })

            if (!lesson) {
                return res.status(404).json({ error: 'Το μάθημα δεν βρέθηκε' })
            }

            if (lesson.bookings.length >= lesson.maxPersons) {
                return res.status(400).json({ error: 'Δεν υπάρχουν διαθέσιμες θέσεις' })
            }

            const existing = await prisma.booking.findFirst({
                where: { lessonId, customerId: req.user.id, status: { not: 'cancelled' } }
            })

            if (existing) {
                return res.status(400).json({ error: 'Έχεις ήδη κλείσει θέση σε αυτό το μάθημα' })
            }

            const customer = await prisma.customer.findUnique({ where: { id: req.user.id } })

            const booking = await prisma.booking.create({
                data: {
                    lessonId,
                    customerId: req.user.id,
                    customerName: customer.name,
                    customerPhone: customer.phone || '',
                    status: 'confirmed'
                }
            })

            await syncLessonStatus(lessonId)

            return res.status(201).json(booking)
        }

        // Έλεγχος ατόμων
        if (persons < 1 || persons > 10) {
            return res.status(400).json({ error: 'Ο αριθμός ατόμων πρέπει να είναι μεταξύ 1 και 10' })
        }

        assertNotPastDate(date)

        if (instructorId) {
            assertWithinWorkingHours(startTime, duration)
            await assertInstructorAvailable(prisma, { instructorId, date, startTime, duration })
        }

        const customer = await prisma.customer.findUnique({ where: { id: req.user.id } })
        const price = calculatePrice(persons, duration)
        const type = persons > 1 ? 'group' : 'individual'

        const lesson = await prisma.lesson.create({
            data: {
                date: new Date(date),
                startTime: startTime || '09:00',
                duration,
                sport,
                level,
                price,
                type,
                persons,
                status: instructorId ? 'confirmed' : 'pending',
                schoolId,
                instructorId: instructorId || null,
                bookings: {
                    create: {
                        customerId: req.user.id,
                        customerName: customer.name,
                        customerPhone: customer.phone || '',
                        status: instructorId ? 'confirmed' : 'pending'
                    }
                }
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

// Λίστα κρατήσεων πελάτη
const getMyBookings = async (req, res, next) => {
    try {
        const bookings = await prisma.booking.findMany({
            where: { customerId: req.user.id },
            include: {
                lesson: {
                    include: {
                        instructor: { select: { id: true, name: true } },
                        school: { select: { id: true, name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        })
        res.json(bookings)
    } catch (error) {
        next(error)
    }
}

// Ακύρωση κράτησης από πελάτη
const cancelMyBooking = async (req, res, next) => {
    try {
        const booking = await prisma.booking.findFirst({
            where: { id: req.params.id, customerId: req.user.id }
        })

        if (!booking) {
            return res.status(404).json({ error: 'Η κράτηση δεν βρέθηκε' })
        }

        if (booking.status === 'cancelled') {
            return res.status(400).json({ error: 'Η κράτηση είναι ήδη ακυρωμένη' })
        }

        await prisma.booking.update({
            where: { id: req.params.id },
            data: { status: 'cancelled' }
        })

        await syncLessonStatus(booking.lessonId)

        res.json({ message: 'Η κράτηση ακυρώθηκε επιτυχώς' })
    } catch (error) {
        next(error)
    }
}

module.exports = { register, getAvailableSlots, bookLesson, getMyBookings, cancelMyBooking }
