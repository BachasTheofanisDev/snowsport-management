const prisma = require('../prisma/client')

// Δημιουργία αξιολόγησης (από πελάτη)
const createReview = async (req, res) => {
    const { bookingId, rating, comment } = req.body

    try {
        // Έλεγχος αν η κράτηση ανήκει στον πελάτη
        const booking = await prisma.booking.findFirst({
            where: { id: bookingId, customerId: req.user.id },
            include: { lesson: true }
        })

        if (!booking) {
            return res.status(404).json({ error: 'Η κράτηση δεν βρέθηκε' })
        }

        // Έλεγχος αν το μάθημα έχει περάσει
        if (new Date(booking.lesson.date) > new Date()) {
            return res.status(400).json({ error: 'Δεν μπορείς να αξιολογήσεις πριν το μάθημα' })
        }

        // Έλεγχος αν υπάρχει ήδη αξιολόγηση
        const existing = await prisma.review.findUnique({
            where: { bookingId }
        })

        if (existing) {
            return res.status(400).json({ error: 'Έχεις ήδη αξιολογήσει αυτό το μάθημα' })
        }

        // Έλεγχος rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Η αξιολόγηση πρέπει να είναι μεταξύ 1 και 5' })
        }

        const review = await prisma.review.create({
            data: {
                bookingId,
                rating,
                comment: comment || null,
                customerId: req.user.id,
                instructorId: booking.lesson.instructorId
            },
            include: {
                customer: { select: { id: true, name: true } },
                instructor: { select: { id: true, name: true } }
            }
        })

        res.status(201).json(review)
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

// Αξιολογήσεις εκπαιδευτή
const getInstructorReviews = async (req, res) => {
    try {
        const reviews = await prisma.review.findMany({
            where: { instructorId: req.params.id },
            include: {
                customer: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        })

        const avgRating = reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0

        res.json({ reviews, avgRating: Math.round(avgRating * 10) / 10, total: reviews.length })
    } catch (error) {
        res.status(500).json({ error: error.message })
    }
}

module.exports = { createReview, getInstructorReviews }