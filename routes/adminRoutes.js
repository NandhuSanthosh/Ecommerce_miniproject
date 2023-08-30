const { get_adminLogin , post_adminLogin, get_adminHome, get_otpAuth, get_otp, post_verifyOtp, get_users, patch_blockUser, get_categories, post_createCategory, delete_category, patch_updateRequest} = require('../controllers/adminControllers');
const { get_products, post_product, delete_product, delete_image, patch_updateProduct, patch_addImage } = require('../controllers/productControllers');
const {isLogged, isNotLogged, parser, isAwaitingOtp} = require('../Middleware/adminAutherization')

const router = require('express').Router();
const multer = require('multer')

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


// CATEGORY
router.get('/get_categories', isLogged, get_categories)
router.post('/create_category', isLogged, post_createCategory);
router.delete('/delete_category', isLogged, delete_category)
router.patch('/update_category/:id', isLogged, patch_updateRequest)



// PRODUCTS
router.get('/get_products', isLogged, get_products)
router.post('/create_product', upload.array("images"), isLogged, post_product)
router.delete('/delete_product/:id', isLogged, delete_product)
router.patch('/delete_image/:id', isLogged, delete_image)
router.patch('/update_product', isLogged, patch_updateProduct)
router.patch('/add_image/:id', isLogged, upload.single("image"),  patch_addImage)

module.exports = router;