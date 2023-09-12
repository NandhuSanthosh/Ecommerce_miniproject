const { isLogged } = require('../Middleware/adminAutherization');
const { get_all_order, patch_update_status, patch_update_estimateDeliveryDate, delete_cancel_order, get_order_stages } = require('../controllers/orderControllers');

const router = require('express').Router();

router.get('/get_all_orders', isLogged, get_all_order)
router.get('/get_orderstages', isLogged, get_order_stages)

router.patch('/update_status', isLogged, patch_update_status)
router.patch("/update_estimated_delivery_date/:id", isLogged, patch_update_estimateDeliveryDate)

module.exports = router;