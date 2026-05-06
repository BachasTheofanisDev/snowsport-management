const express = require('express');
const router = express.Router();
const { createInstructor, getInstructors, getLessons, getMyReviews } = require('../controllers/instructorController')
const auth = require('../middleware/auth');

// Δημιουργία Εκπαιδευτή (μόνο η Σχολή)
router.post('/register', auth(['school']), createInstructor);

// Λίστα μαθημάτων (μόνο ο Εκπαιδευτής)
router.get('/lessons', auth(['instructor']), getLessons);

// Αξιολογήσεις εκπαιδευτή
router.get('/reviews', auth(['instructor']), getMyReviews)

module.exports = router;