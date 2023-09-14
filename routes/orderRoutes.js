const express = require('express');
const { isLogged } = require('../Middleware/userAutherization');
const { post_checkout, get_checkout, patch_complete_order, get_orders, cancel_order_user} = require('../controllers/orderControllers');
const router = express.Router();



router.post('/post_checkout', isLogged, post_checkout);
router.get('/get_checkout_page/:id', isLogged, get_checkout)
router.patch('/complete_order/:id', isLogged, patch_complete_order)
router.get('/get_orders', isLogged, get_orders)


router.delete('/delete_order', isLogged, cancel_order_user);



module.exports = router