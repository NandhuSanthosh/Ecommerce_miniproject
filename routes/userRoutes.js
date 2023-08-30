const express = require('express')
const router = express.Router();

const jwt = require('jsonwebtoken')

const userControllers = require('../controllers/userControllers');
const { isNotLogged, isRegestered, isLogged } = require('../Middleware/userAutherization');
const { get_product_details, get_serach_result, get_product_searchPage } = require('../controllers/productControllers');




router.get('/', userControllers.get_home)

router.route('/signin').all(isNotLogged).get(userControllers.get_signup).post(userControllers.post_signin)
router.route('/login').all(isNotLogged).get(userControllers.get_login).post(userControllers.post_login)



router.route('/otp-Auth').get(isRegestered, userControllers.get_otpAuthPage)
router.route('/request-otp').get(isRegestered, userControllers.get_otp)
router.route('/login-verify-otp').post(isRegestered, userControllers.post_loginVerifyOtp)
router.post('/verify-otp',isRegestered, userControllers.post_verifyOtp)


router.get('/get_product_search_page', get_product_searchPage)
router.get('/product_details/:id', get_product_details);
router.get('/search_product', get_serach_result);

    

module.exports = router;    