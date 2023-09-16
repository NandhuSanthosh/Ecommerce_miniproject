const express = require('express');
const { isLogged } = require('../Middleware/userAutherization');
const { post_checkout, get_checkout, patch_complete_order, get_orders, cancel_order_user, return_order_user, cancel_return_order} = require('../controllers/orderControllers');
const router = express.Router();



router.post('/post_checkout', isLogged, post_checkout);
router.get('/get_checkout_page/:id', isLogged, get_checkout)
router.patch('/complete_order/:id', isLogged, patch_complete_order)
router.get('/get_orders', isLogged, get_orders)


router.delete('/delete_order', isLogged, cancel_order_user);
router.patch("/return_order", isLogged, return_order_user);
router.patch("/cancel_return", isLogged, cancel_return_order);





module.exports = router