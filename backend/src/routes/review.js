const express = require('express')
const router = express.Router()
const { createReview, getInstructorReviews } = require('../controllers/reviewController')
const auth = require('../middleware/auth')

// Δημιουργία αξιολόγησης (μόνο πελάτης)
router.post('/', auth(['customer']), createReview)

// Αξιολογήσεις εκπαιδευτή (όλοι)
router.get('/instructor/:id', getInstructorReviews)

module.exports = router