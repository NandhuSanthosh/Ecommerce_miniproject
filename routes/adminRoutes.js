const { get_adminLogin , post_adminLogin, get_adminHome, get_otpAuth, 
    get_otp, post_verifyOtp, get_users, patch_blockUser, get_categories, 
    post_createCategory, delete_category, patch_updateRequest, 
    get_complete_userDetails, get_forgotPassword, post_forgotPassword, 
    get_resetPassword, post_resetPassword, get_user_serach_result, get_category_serach_result, get_all_categories, 
    get_dashboard_details, get_dashboard_monothy
} = require('../controllers/adminControllers');
const { get_products, post_product, delete_product, delete_image, patch_updateProduct, patch_addImage, get_serach_result } = require('../controllers/productControllers');
const {isLogged, isNotLogged, parser, isAwaitingOtp} = require('../Middleware/adminAutherization')

const router = require('express').Router();
const multer = require('multer');
const { errorHandler } = require('../Middleware/errorHandler');
const { post_createCoupon, patch_coupon, put_activate_coupon, put_activateCoupon, put_deactivateCoupon, get_coupons, get_coupons_search_result } = require('../controllers/couponControllers');

router.use(parser)

router.route('/').all(isLogged).get(get_adminHome)
router.route('/login').all(isNotLogged).get(get_adminLogin).post(post_adminLogin)

router.get('/otp-auth', isAwaitingOtp,  get_otpAuth)
router.get('/request-otp',isAwaitingOtp,  get_otp)
router.post('/verify-otp',isAwaitingOtp,   post_verifyOtp)

const upload = multer({ dest: 'uploads/' })


// USER
router.get('/get_users', isLogged, get_users)
router.patch('/block_user', isLogged, patch_blockUser)
router.get('/complete_userDetails/:id', isLogged, get_complete_userDetails);
router.get('/search_user', isLogged, get_user_serach_result)



// CATEGORY
router.get('/get_categories', isLogged, get_categories)
router.get('/get_all_categories', isLogged, get_all_categories)
router.post('/create_category', isLogged, post_createCategory);
router.delete('/delete_category', isLogged, delete_category)
router.patch('/update_category/:id', isLogged, patch_updateRequest)
router.get('/search_category', isLogged, get_category_serach_result)



// PRODUCTS
router.get('/get_products', isLogged, get_products)
router.post('/create_product', upload.array("images"), isLogged, post_product)
router.delete('/delete_product/:id', isLogged, delete_product)
router.patch('/delete_image/:id', isLogged, delete_image)
router.patch('/update_product', isLogged, patch_updateProduct)
router.patch('/add_image/:id', isLogged, upload.single("image"),  patch_addImage)
router.get('/search_product', isLogged, get_serach_result)


// forgot password
router.route('/forgot_password').get(isNotLogged, get_forgotPassword).post(isNotLogged, post_forgotPassword)
// reset password
router.route('/reset_password/:key').get(isNotLogged, get_resetPassword).patch(isNotLogged, post_resetPassword)


// coupon
router.post('/create_coupon', isLogged, post_createCoupon)
router.patch("/update_coupon", isLogged, patch_coupon)
router.put("/activate_coupon", isLogged, put_activateCoupon)
router.put("/diactivate_coupon", isLogged, put_deactivateCoupon)
router.get("/coupons", isLogged, get_coupons)
router.get("/search_coupon", isLogged, get_coupons_search_result)



// dashboard
router.get("/get_dashboard_details", isLogged, get_dashboard_details)
router.get('/dashmoard_monthy_chart', isLogged, get_dashboard_monothy)






router.use(errorHandler);
module.exports = router;