const express = require('express');
const router = express.Router();
const { createSchool, getInstructors, updateInfo, uploadGallery, deleteGalleryImage, setMainImage } = require('../controllers/schoolController')
const auth = require('../middleware/auth');
const upload = require('../middleware/upload')

// Δημιουργία Σχολής (μόνο το Resort)
router.post('/register', auth(['resort']), createSchool);

// Λίστα εκπαιδευτών (μόνο η Σχολή)
router.get('/instructors', auth(['school']), getInstructors);

router.patch('/info', auth(['school']), updateInfo)
router.post('/upload-gallery', auth(['school']), upload.array('images', 10), uploadGallery)
router.patch('/gallery/delete', auth(['school']), deleteGalleryImage)
router.patch('/set-main', auth(['school']), setMainImage)

module.exports = router;