const orderModel = require("../Models/orderModel");
const productModel = require("../Models/productModel");
const userCartModel = require("../Models/userCartModel");
const userModels = require("../Models/userModels");



exports.post_checkout = async function(req, res, next){
    try {
        const {products} = req.body
        const userId = req.userDetails.userDetails._id;
        const productRelatedDetails = await productModel.find_total_price(products);

        const orderDoc = await orderModel.create_new_order(userId, products, productRelatedDetails.payable, productRelatedDetails.isFreeDelivery, productRelatedDetails.total - productRelatedDetails.payable )
        const link = "http://localhost:3000/order/get_checkout_page/"+orderDoc;
        res.send({isSuccess: true, redirect: link})
    } catch (error) {
        next(error)
    }
}

exports.get_checkout = async function(req, res, next){
    try {
        const id = req.params.id;
        const userId = req.userDetails.userDetails._id
        const orderDoc = await orderModel.find_order_details(id);
        const userAddress = await userModels.getAddress(userId)
        res.render('authViews/checkoutPage', {orderDoc, userAddress})
    } catch (error) {
        next(error)
    }
}

exports.patch_complete_order = async function(req, res, next){
    try {
        const orderId = req.params.id
        const {addressId, paymentMethod} = req.body;
        const orderDoc = await orderModel.complete_order_handler(orderId, addressId, paymentMethod)
        const link = "http://localhost:3000/order/get_orders"
        res.send({isSuccess: true, redirect: link})
    } catch (error) {
        next(error)
    }
}

exports.get_orders = async function(req, res, next){
    try {
        const userId = req.userDetails.userDetails._id;
        const userOrders = await orderModel.find_user_orders(userId);
        res.render('authViews/ordersPage', {userOrders})
    } catch (error) {
        next(error);
    }
}

exports.delete_order = async function(req, res, next){
    try {
        const orderId = req.params.id
        const result = await orderModel.delete_order(orderId)
        res.send({isSuccess: true})
    } catch (error) {
        next(error)
    }
}


// ADMIN
exports.get_order_stages = async function(req, res, next){
    try {
        const orderStages = await orderModel.fetch_all_stages();
        res.send({isSuccess: true, orderStages})
    } catch (error) {
        next(error)
    }
}

exports.get_all_order = async function(req, res, next){
    try {
        const p = req.query.pno;
        const {data, totalCount} = await orderModel.find_all_order(p);
        res.send({isSuccess: true, data, totalCount})
    } catch (error) {
        next(error)
    }
}

exports.patch_update_status = async function(req, res, next){
    try {
        const {id, status, cancelReason} = req.query;
        const result = await orderModel.update_order_status(id, status, cancelReason);
        res.send({isSuccess: true, data: result})
    } catch (error) {
        next(error)
    }
}

exports.patch_update_estimateDeliveryDate = async function(req, res, next){
    try {
        const {id, newExtimatedDate} = req.query;
        const updatedOrder = await orderModel.update_extimated_date(id, newExtimatedDate);
        res.send({isSuccess: true, updatedOrder})
    } catch (error) {
        next(error)
    }
}


