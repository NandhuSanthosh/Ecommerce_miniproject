const router = require("express").Router();
const { isLogged, isNotLogged } = require('../Middleware/userAutherization');
const { post_create_order, post_verify } = require("../controllers/paymentControllers");

router.post('/create_order', isLogged, post_create_order)
router.post('/verify', isLogged, post_verify)


module.exports = router;