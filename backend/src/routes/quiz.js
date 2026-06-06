const express = require('express')
const router = express.Router()
const { evaluateLevel } = require('../controllers/quizController')

// Αξιολόγηση επιπέδου (ανοιχτό - χωρίς login)
router.post('/evaluate', evaluateLevel)

module.exports = router