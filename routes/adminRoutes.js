const { get_adminLogin , post_adminLogin, get_adminHome, get_otpAuth, get_otp, post_verifyOtp, get_users, patch_blockUser, get_categories, post_createCategory, delete_category, patch_updateRequest} = require('../controllers/adminControllers');
const {isLogged, isNotLogged, parser, isAwaitingOtp} = require('../Middleware/adminAutherization')

const router = require('express').Router();

router.use(parser)

router.route('/').all(isLogged).get(get_adminHome)
router.route('/login').all(isNotLogged).get(get_adminLogin).post(post_adminLogin)

router.get('/otp-auth', isAwaitingOtp,  get_otpAuth)
router.get('/request-otp',isAwaitingOtp,  get_otp)
router.post('/verify-otp',isAwaitingOtp,   post_verifyOtp)

router.get('/get_users', isLogged, get_users)
router.patch('/block_user', isLogged, patch_blockUser)

router.get('/get_categories', isLogged, get_categories)
router.post('/create_category', isLogged, post_createCategory);
router.delete('/delete_category', isLogged, delete_category)
router.patch('/update_category/:id', isLogged, patch_updateRequest)

module.exports = router;