const express = require('express')
const router = express.Router();

const utilityControllers = require('../controllers/utilityControllers.js')

router.get('/countryCodes', utilityControllers.get_countyCode)

module.exports = router;