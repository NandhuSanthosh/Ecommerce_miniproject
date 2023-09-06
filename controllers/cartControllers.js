const userCartModel = require("../Models/userCartModel");
const userModels = require("../Models/userModels");

exports.post_edit_product =  async function(req, res, next){
    try {
        const userId = req.userDetails.userDetails._id;
        const {productId, quantity} = req.body;
        const cartId = await userModels.getCart(userId);
        const userCart = await userCartModel.edit_product(cartId, productId, quantity);
        res.send({isSuccess: true})
    } catch (error) {
        next(error)
    }
}

exports.get_cart_products = async function(req, res, next){
    try {
        const userId = req.userDetails.userDetails._id; 
        const cartId = await userModels.getCart(userId);
        const productDetails = await userCartModel.get_cart_products(cartId);
        res.send(productDetails)
    } catch (error) {
        next(error)
    }
}

