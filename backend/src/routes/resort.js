const express = require('express');
const router = express.Router();
const { createResort, getSchools, toggleSchool, deleteSchool } = require('../controllers/resortController');
const auth = require('../middleware/auth');

// Δημιουργία Resort (χωρίς auth - μόνο μια φορά)
router.post('/register', createResort);

// Λίστα σχολών (μόνο το resort)
router.get('/schools', auth(['resort']), getSchools);

// Απενεργοποίηση/Ενεργοποίηση σχολής
router.patch('/:id/toggle', auth(['resort']), toggleSchool)

// Διαγραφή σχολής
router.delete('/:id', auth(['resort']), deleteSchool)

module.exports = router;