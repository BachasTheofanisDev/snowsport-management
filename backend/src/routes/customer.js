const express = require('express')
const router = express.Router()
const { register, getAvailableSlots, bookLesson, getMyBookings, cancelMyBooking } = require('../controllers/customerController')
const auth = require('../middleware/auth')

// Εγγραφή πελάτη (χωρίς login)
router.post('/register', register)

// Διαθέσιμες ώρες (χωρίς login)
router.get('/slots', getAvailableSlots)

// Κράτηση μαθήματος (με login)
router.post('/bookings', auth(['customer']), bookLesson)

// Λίστα κρατήσεων πελάτη (με login)
router.get('/bookings', auth(['customer']), getMyBookings)

// Ακύρωση κράτησης (με login)
router.patch('/bookings/:id/cancel', auth(['customer']), cancelMyBooking)

router.get('/schools', async (req, res) => {
    const prisma = require('../prisma/client')
    try {
        const schools = await prisma.school.findMany({
            select: { id: true, name: true }
        })
        res.json(schools)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Διαθέσιμα ομαδικά μαθήματα
router.get('/open-groups', async (req, res) => {
    const prisma = require('../prisma/client')
    const { schoolId } = req.query

    try {
        const lessons = await prisma.lesson.findMany({
            where: {
                type: 'open_group',
                schoolId,
                date: { gte: new Date() },
                status: { not: 'cancelled' }
            },
            include: {
                instructor: { select: { id: true, name: true } },
                school: { select: { id: true, name: true } },
                bookings: {
                    where: { status: { not: 'cancelled' } }
                }
            },
            orderBy: [{ date: 'asc' }, { startTime: 'asc' }]
        })

        // Φιλτράρισμα - μόνο αυτά που έχουν διαθέσιμες θέσεις
        const available = lessons.filter(l => l.bookings.length < l.maxPersons)
        res.json(available)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

module.exports = router