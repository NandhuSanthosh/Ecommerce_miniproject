const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: "products"
        }, 
        quantity: {
            type: Number, 
            default: 1
        }
    }]
})

cartSchema.statics.edit_product = async function(cartId, productId, quantity){
    if(!cartId || !productId) throw new Error("Please provide necessary infomation")
    if(quantity < 0) throw new Error("Quantity cannot be negative")
    else if(quantity == 0){
        // remove item
        const removeResult = await this.updateOne({_id: cartId, "products.productId": productId}, {$pull: {"products": {"productId" : productId}}})
    }
    else{
        
        const incrementResult = await this.updateOne({_id: cartId, "products.productId": productId}, {$set : {"products.$.quantity": quantity}})
        if(incrementResult.matchedCount == 0){
            const cart = await this.updateOne({_id: cartId}, {$addToSet: {products: {productId, quantity}}})    
        }
    }
}

cartSchema.statics.get_cart_products = async function(cartId){
    if(!cartId) throw new Error("Please provide necessary informations. 3")
    const productDetails = await this.findById(cartId).populate('products.productId');
    return productDetails
}


module.exports = mongoose.model("Carts", cartSchema)