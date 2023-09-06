const express = require('express');
const { isLogged } = require('../Middleware/userAutherization');
const { post_edit_product, get_cart_products } = require('../controllers/cartControllers');
const router = express.Router();

router.get('/add_routes', isLogged, post_edit_product)
router.get('/get_cart', isLogged, get_cart_products)

module.exports = router