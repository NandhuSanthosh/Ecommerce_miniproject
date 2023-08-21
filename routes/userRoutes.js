const express = require('express')
const router = express.Router();

const jwt = require('jsonwebtoken')

const userControllers = require('../controllers/userControllers');
const { isNotLogged, isRegestered, isLogged } = require('../Middleware/autherization');


router.get('/', isLogged, userControllers.get_home)

router.route('/signin').all(isNotLogged).get(userControllers.get_signup).post(userControllers.post_signin)
router.route('/login').all(isNotLogged).get(userControllers.get_login).post(userControllers.post_login)



router.route('/otp-Auth').get(isRegestered, userControllers.get_otpAuthPage)
router.route('/request-otp').get(isRegestered, userControllers.get_otp)
router.post('/verify-otp',isRegestered, userControllers.post_verifyOtp)



module.exports = router;