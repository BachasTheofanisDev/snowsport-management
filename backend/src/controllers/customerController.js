const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../prisma/client')
const { calculatePrice } = require('../utils/pricing')

// Εγγραφή πελάτη
const register = async (req, res) => {
    const { name, email, password, phone } = req.body

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
        res.status(500).json({ error: error.message })
    }
}

// Διαθέσιμες ώρες εκπαιδευτή για μια ημερομηνία
const getAvailableSlots = async (req, res) => {
    const { date, schoolId } = req.query

    try {
        // Βρες όλους τους εκπαιδευτές της σχολής
        const instructors = await prisma.instructor.findMany({
            where: { schoolId },
            select: { id: true, name: true, specialty: true }
        })

        // Για κάθε εκπαιδευτή βρες τα κατειλημμένα slots
        const result = await Promise.all(instructors.map(async (instructor) => {
            const lessons = await prisma.lesson.findMany({
                where: {
                    instructorId: instructor.id,
                    date: new Date(date),
                    status: { not: 'cancelled' }
                },
                select: { startTime: true, duration: true }
            })

            // Υπολόγισε κατειλημμένες ώρες
            const bookedHours = []
            lessons.forEach(lesson => {
                const start = parseInt(lesson.startTime.split(':')[0])
                for (let i = 0; i < lesson.duration; i++) {
                    bookedHours.push(start + i)
                }
            })

            // Ελεύθερες ώρες (09:00 - 15:00)
            const allHours = [9, 10, 11, 12, 13, 14, 15]
            const availableHours = allHours.filter(h => !bookedHours.includes(h))

            return {
                ...instructor,
                bookedHours,
                availableHours
            }
        }))

        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Κράτηση μαθήματος (με login)
const bookLesson = async (req, res) => {
    const { lessonId, isOpenGroup, date, startTime, duration, sport, level, schoolId, instructorId, persons = 1 } = req.body

    try {
        // Αν είναι join σε υπάρχον open group
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

            // Έλεγχος αν έχει ήδη κλείσει ο πελάτης
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

            // Αν φτάσαμε το min → confirmed το μάθημα
            const totalBookings = lesson.bookings.length + 1
            if (totalBookings >= lesson.minPersons) {
                await prisma.lesson.update({
                    where: { id: lessonId },
                    data: { status: 'confirmed', persons: totalBookings }
                })
            } else {
                await prisma.lesson.update({
                    where: { id: lessonId },
                    data: { persons: totalBookings }
                })
            }

            return res.status(201).json(booking)
        }

        const customer = await prisma.customer.findUnique({ where: { id: req.user.id } })

        // Έλεγχος ατόμων
        if (persons < 1 || persons > 10) {
            return res.status(400).json({ error: 'Ο αριθμός ατόμων πρέπει να είναι μεταξύ 1 και 10' })
        }

        // Έλεγχος ημερομηνίας
        const lessonDate = new Date(date)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (lessonDate < today) {
            return res.status(400).json({ error: 'Δεν μπορείς να κλείσεις μάθημα σε παρελθοντική ημερομηνία' })
        }

        // Υπολογισμός τιμής
        const price = calculatePrice(persons, duration)
        const type = persons > 1 ? 'group' : 'individual'

        // Αν έχει επιλεγεί εκπαιδευτής, έλεγχος επικάλυψης
        if (instructorId) {
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
                    status: { not: 'cancelled' }
                }
            })

            for (const lesson of existingLessons) {
                const existingStart = timeToMinutes(lesson.startTime)
                const existingEnd = existingStart + lesson.duration * 60
                if (startMinutes < existingEnd && endMinutes > existingStart) {
                    return res.status(400).json({ error: 'Ο εκπαιδευτής δεν είναι διαθέσιμος αυτή την ώρα' })
                }
            }
        }

        // Δημιουργία μαθήματος και κράτησης
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
        res.status(500).json({ error: error.message })
    }
}

// Λίστα κρατήσεων πελάτη
const getMyBookings = async (req, res) => {
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
        res.status(500).json({ error: error.message })
    }
}

// Ακύρωση κράτησης από πελάτη
const cancelMyBooking = async (req, res) => {
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

        // Αλλαγή status του lesson σε cancelled
        await prisma.lesson.update({
            where: { id: booking.lessonId },
            data: { status: 'cancelled' }
        })

        res.json({ message: 'Η κράτηση ακυρώθηκε επιτυχώς' })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = { register, getAvailableSlots, bookLesson, getMyBookings, cancelMyBooking }