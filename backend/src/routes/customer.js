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

// Λίστα χιονοδρομικών (για επιλογή)
router.get('/resorts', async (req, res) => {
    const prisma = require('../prisma/client')
    try {
        const resorts = await prisma.resort.findMany({
            select: {
                id: true, name: true, image: true,
                _count: { select: { schools: true } }
            }
        })
        res.json(resorts)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Σχολές συγκεκριμένου χιονοδρομικού
router.get('/resorts/:id/schools', async (req, res) => {
    const prisma = require('../prisma/client')
    try {
        const schools = await prisma.school.findMany({
            where: { resortId: req.params.id, isActive: true },
            select: {
                id: true, name: true, image: true, phone: true,
                instructors: {
                    select: {
                        id: true,
                        reviews: { select: { rating: true } }
                    }
                }
            }
        })

        // Υπολογισμός μέσου όρου σχολής (όλες οι αξιολογήσεις όλων των εκπαιδευτών)
        const result = schools.map(s => {
            const allRatings = s.instructors.flatMap(i => i.reviews.map(r => r.rating))
            const avgRating = allRatings.length > 0
                ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
                : 0
            return {
                id: s.id,
                name: s.name,
                image: s.image,
                phone: s.phone,
                instructors: s.instructors.map(i => ({ id: i.id })),
                avgRating,
                totalReviews: allRatings.length
            }
        })

        res.json(result)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Εκπαιδευτές σχολής (με φωτό & αξιολογήσεις)
router.get('/schools/:id/instructors', async (req, res) => {
    const prisma = require('../prisma/client')
    try {
        const instructors = await prisma.instructor.findMany({
            where: { schoolId: req.params.id },
            select: {
                id: true, name: true, image: true, specialty: true,
                reviews: { select: { rating: true } }
            }
        })

        const withRatings = instructors.map(i => ({
            id: i.id,
            name: i.name,
            image: i.image,
            specialty: i.specialty,
            avgRating: i.reviews.length > 0
                ? Math.round((i.reviews.reduce((s, r) => s + r.rating, 0) / i.reviews.length) * 10) / 10
                : 0,
            totalReviews: i.reviews.length
        }))

        res.json(withRatings)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Πλήρεις πληροφορίες χιονοδρομικού
router.get('/resorts/:id/info', async (req, res) => {
    const prisma = require('../prisma/client')
    try {
        const resort = await prisma.resort.findUnique({
            where: { id: req.params.id },
            select: {
                id: true, name: true, image: true, description: true,
                baseAltitude: true, peakAltitude: true, liftsCount: true, totalSlopeLength: true,
                slopesGreen: true, slopesBlue: true, slopesRed: true, slopesBlack: true,
                location: true, openingHours: true, phone: true, mapImage: true, gallery: true
            }
        })
        res.json(resort)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Πλήρεις πληροφορίες σχολής (με κληρονομημένα στοιχεία χιονοδρομικού)
router.get('/schools/:id/info', async (req, res) => {
    const prisma = require('../prisma/client')
    try {
        const school = await prisma.school.findUnique({
            where: { id: req.params.id },
            select: {
                id: true, name: true, image: true, description: true, phone: true, gallery: true,
                instructors: { select: { reviews: { select: { rating: true } } } },
                resort: {
                    select: { location: true, openingHours: true, mapImage: true, name: true }
                }
            }
        })

        const allRatings = school.instructors.flatMap(i => i.reviews.map(r => r.rating))
        const avgRating = allRatings.length > 0
            ? Math.round((allRatings.reduce((a, b) => a + b, 0) / allRatings.length) * 10) / 10
            : 0

        const { instructors, ...rest } = school
        res.json({ ...rest, avgRating, totalReviews: allRatings.length })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Πλήρες προφίλ εκπαιδευτή + διαθεσιμότητα για ημερομηνία
router.get('/instructor/:id/availability', async (req, res) => {
    const prisma = require('../prisma/client')
    const { date } = req.query
    try {
        const instructor = await prisma.instructor.findUnique({
            where: { id: req.params.id },
            select: {
                id: true, name: true, image: true, description: true, specialty: true,
                reviews: {
                    select: { rating: true, comment: true, customer: { select: { name: true } } },
                    orderBy: { createdAt: 'desc' }
                }
            }
        })

        if (!instructor) return res.status(404).json({ error: 'Δεν βρέθηκε εκπαιδευτής' })

        // Υπολογισμός μέσου όρου
        const avgRating = instructor.reviews.length > 0
            ? Math.round((instructor.reviews.reduce((s, r) => s + r.rating, 0) / instructor.reviews.length) * 10) / 10
            : 0

        // Βρες κατειλημμένες ώρες για τη συγκεκριμένη ημερομηνία
        let bookedHours = []
        if (date) {
            const start = new Date(date); start.setHours(0, 0, 0, 0)
            const end = new Date(date); end.setHours(23, 59, 59, 999)

            const lessons = await prisma.lesson.findMany({
                where: {
                    instructorId: req.params.id,
                    date: { gte: start, lte: end },
                    status: { not: 'cancelled' }
                },
                select: { startTime: true, duration: true }
            })

            lessons.forEach(l => {
                const startHour = parseInt(l.startTime.split(':')[0])
                for (let h = startHour; h < startHour + l.duration; h++) {
                    bookedHours.push(h)
                }
            })
        }

        res.json({
            ...instructor,
            avgRating,
            totalReviews: instructor.reviews.length,
            bookedHours
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

module.exports = router