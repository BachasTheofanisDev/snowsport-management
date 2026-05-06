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

// Προφίλ σχολής
router.get('/schools/:id', async (req, res) => {
    const prisma = require('../prisma/client')
    try {
        const school = await prisma.school.findUnique({
            where: { id: req.params.id },
            select: {
                id: true, name: true, phone: true,
                instructors: {
                    select: {
                        id: true, name: true, specialty: true,
                        reviews: {
                            select: { rating: true }
                        }
                    }
                }
            }
        })

        if (!school) return res.status(404).json({ error: 'Η σχολή δεν βρέθηκε' })

        // Υπολογισμός μέσου όρου ανά εκπαιδευτή
        const instructorsWithRating = school.instructors.map(i => ({
            ...i,
            avgRating: i.reviews.length > 0
                ? Math.round((i.reviews.reduce((sum, r) => sum + r.rating, 0) / i.reviews.length) * 10) / 10
                : 0,
            totalReviews: i.reviews.length
        }))

        res.json({ ...school, instructors: instructorsWithRating })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Προφίλ εκπαιδευτή
router.get('/instructor/:id', async (req, res) => {
    const prisma = require('../prisma/client')
    try {
        const instructor = await prisma.instructor.findUnique({
            where: { id: req.params.id },
            select: {
                id: true, name: true, specialty: true, phone: true,
                reviews: {
                    include: { customer: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' },
                    take: 5
                }
            }
        })

        if (!instructor) return res.status(404).json({ error: 'Ο εκπαιδευτής δεν βρέθηκε' })

        const avgRating = instructor.reviews.length > 0
            ? Math.round((instructor.reviews.reduce((sum, r) => sum + r.rating, 0) / instructor.reviews.length) * 10) / 10
            : 0

        res.json({ ...instructor, avgRating, totalReviews: instructor.reviews.length })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

module.exports = router