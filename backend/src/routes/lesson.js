const express = require('express');
const router = express.Router();
const { createLesson, getLessons, deleteLesson, updateLesson, cancelBooking, assignInstructor, createOpenGroupLesson } = require('../controllers/lessonController');
const auth = require('../middleware/auth');

// Δημιουργία μαθήματος (μόνο η Σχολή)
router.post('/', auth(['school']), createLesson);

// Λίστα μαθημάτων (μόνο η Σχολή)
router.get('/', auth(['school']), getLessons);

// Διαγραφή μαθήματος (μόνο η Σχολή)
router.delete('/:id', auth(['school']), deleteLesson);

// Επεξεργασία μαθήματος (μόνο η Σχολή)
router.put('/:id', auth(['school']), updateLesson)

// Ακύρωση κράτησης
router.patch('/bookings/:id/cancel', auth(['school']), cancelBooking)

// Ανάθεση εκπαιδευτή
router.patch('/:id/assign', auth(['school']), assignInstructor)

// Πρόγραμμα ημέρας για τη σχολή
router.get('/schedule', auth(['school']), async (req, res) => {
    const { date } = req.query
    try {
        const prisma = require('../prisma/client')
        const lessons = await prisma.lesson.findMany({
            where: {
                schoolId: req.user.id,
                date: new Date(date)
            },
            include: {
                instructor: { select: { id: true, name: true } },
                bookings: true
            }
        })
        res.json(lessons)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Στατιστικά σχολής
router.get('/stats', auth(['school']), async (req, res) => {
    const { dateFrom, dateTo } = req.query
    const prisma = require('../prisma/client')

    try {
        const start = dateFrom ? new Date(dateFrom) : new Date(new Date().setHours(0, 0, 0, 0))
        const end = dateTo ? new Date(new Date(dateTo).setHours(23, 59, 59, 999)) : new Date(new Date().setHours(23, 59, 59, 999))

        const lessons = await prisma.lesson.findMany({
            where: {
                schoolId: req.user.id,
                date: { gte: start, lte: end },
                status: { not: 'cancelled' }
            },
            include: {
                instructor: { select: { id: true, name: true } }
            }
        })

        // Συνολικά στατιστικά
        const totalLessons = lessons.length
        const individualLessons = lessons.filter(l => l.type === 'individual').length
        const groupLessons = lessons.filter(l => l.type === 'group').length
        const confirmedLessons = lessons.filter(l => l.status === 'confirmed').length
        const pendingLessons = lessons.filter(l => l.status === 'pending').length
        const totalRevenue = lessons.reduce((sum, l) => sum + l.price, 0)

        // Έσοδα ανά εκπαιδευτή
        const revenueByInstructor = {}
        lessons.forEach(lesson => {
            if (lesson.instructor) {
                const key = lesson.instructor.id
                if (!revenueByInstructor[key]) {
                    revenueByInstructor[key] = {
                        id: lesson.instructor.id,
                        name: lesson.instructor.name,
                        lessons: 0,
                        revenue: 0
                    }
                }
                revenueByInstructor[key].lessons++
                revenueByInstructor[key].revenue += lesson.price
            }
        })

        res.json({
            period: { from: start, to: end },
            totalLessons,
            individualLessons,
            groupLessons,
            confirmedLessons,
            pendingLessons,
            totalRevenue,
            revenueByInstructor: Object.values(revenueByInstructor)
        })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
})

// Δημιουργία Open Ομαδικού Μαθήματος
router.post('/open-group', auth(['school']), createOpenGroupLesson)

module.exports = router;