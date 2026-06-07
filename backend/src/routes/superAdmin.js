const express = require('express')
const router = express.Router()
const { getOverview, getAllResorts, getAllCustomers, createResort, deleteResort } = require('../controllers/superAdminController')
const auth = require('../middleware/auth')

router.get('/overview', auth(['superadmin']), getOverview)
router.get('/resorts', auth(['superadmin']), getAllResorts)
router.get('/customers', auth(['superadmin']), getAllCustomers)
router.post('/resorts', auth(['superadmin']), createResort)
router.delete('/resorts/:id', auth(['superadmin']), deleteResort)

module.exports = router