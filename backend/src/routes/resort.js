const express = require('express');
const router = express.Router();
const { createResort, getSchools, toggleSchool, deleteSchool, updateInfo, uploadMap, uploadGallery, deleteGalleryImage, setMainImage } = require('../controllers/resortController')
const auth = require('../middleware/auth');
const upload = require('../middleware/upload')

// Δημιουργία Resort (χωρίς auth - μόνο μια φορά)
router.post('/register', createResort);

// Λίστα σχολών (μόνο το resort)
router.get('/schools', auth(['resort']), getSchools);

// Απενεργοποίηση/Ενεργοποίηση σχολής
router.patch('/:id/toggle', auth(['resort']), toggleSchool)

// Διαγραφή σχολής
router.delete('/:id', auth(['resort']), deleteSchool)

router.patch('/info', auth(['resort']), updateInfo)

router.post('/upload-map', auth(['resort']), upload.single('image'), uploadMap)
router.post('/upload-gallery', auth(['resort']), upload.array('images', 10), uploadGallery)
router.patch('/gallery/delete', auth(['resort']), deleteGalleryImage)
router.patch('/set-main', auth(['resort']), setMainImage)

module.exports = router;