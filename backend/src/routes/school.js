const express = require('express');
const router = express.Router();
const { createSchool, getInstructors } = require('../controllers/schoolController');
const auth = require('../middleware/auth');

// Δημιουργία Σχολής (μόνο το Resort)
router.post('/register', auth(['resort']), createSchool);

// Λίστα εκπαιδευτών (μόνο η Σχολή)
router.get('/instructors', auth(['school']), getInstructors);

module.exports = router;