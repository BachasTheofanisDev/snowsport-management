const express = require('express');
const router = express.Router();
const { createInstructor, getLessons, getMyReviews, uploadImage, getMySchool, getMyStats, updateInfo } = require('../controllers/instructorController')
const auth = require('../middleware/auth');
const upload = require('../middleware/upload')

// Δημιουργία Εκπαιδευτή (μόνο η Σχολή)
router.post('/register', auth(['school']), createInstructor);

// Λίστα μαθημάτων (μόνο ο Εκπαιδευτής)
router.get('/lessons', auth(['instructor']), getLessons);

// Αξιολογήσεις εκπαιδευτή
router.get('/reviews', auth(['instructor']), getMyReviews)

router.post('/upload-image', auth(['instructor']), upload.single('image'), uploadImage)

router.get('/my-school', auth(['instructor']), getMySchool)

router.get('/stats', auth(['instructor']), getMyStats)

router.patch('/info', auth(['instructor']), updateInfo)

module.exports = router;