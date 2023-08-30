const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: true, 
        unique: true
    },
    brand: {
        type: String, 
        required: true
    },
    modelName: {
        type: String, 
        required: true
    },
    color: {
        type: String, 
        required: false
    },
    aboutThisItem: [{
        type: String
    }],
    actualPrice: {
        type: Number, 
        required: true
    }, 
    discount: {
        type: Number, 
        max: [99, "The discount is so good to be true."], 
        default: 0
    }, 
    currentPrice: {
        type: Number, 
        required: true
    },
    isFreeDelivery: {
        type: Boolean, 
        default: false
    },
    isPayOnDelivery: {
        type: Boolean, 
        default: false
    },
    replacement: {
        type: Number, 
        default: 0
    }, 
    warranty: {
        type: Number, 
        default: 0
    }, 
    images: [{
        type: String,
        validate: [imageValidation, 'Product must have at least one image.']
    }], 
    isDeleted: {
        type: Boolean, 
        default: false
    }, 
    category: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'categories'
    }
})

productSchema.statics.create_product = async function(productDetails){
    if(productDetails.discount && !productDetails.currentPrice)
        productDetails.currentPrice = findCurrPrice(productDetails.actualPrice, productDetails.discount);
    else if(!productDetails.discount && productDetails.currentPrice)
        productDetails.discount = findDiscount(productDetails.actualPrice, productDetails.currentPrice);
    else if(!productDetails.discount && !productDetails.currentPrice){
        const e =  new Error();
        e.name = "ValidationError";
        throw e;
    }
    const newProduct = await this.create(productDetails);
    return newProduct;
}

productSchema.statics.get_products = async function(){
    const products = await this.find({isDeleted: false});
    return products;
}

productSchema.statics.delete_product = async function(id) {
    if(!id) throw new Error("Please provide necessary details")
    const result = await this.updateOne({_id: id}, {$set: {isDeleted: true}})
    console.log(result);
    if(result.modifiedCount){
        return true;
    }
    throw new Error("Something went wrong, updation failed")
}

productSchema.statics.delete_image = async function(id, src){
    if(!id || !src) throw new Error("Please provide necessary information");
    const result = await this.updateOne({_id: id}, {$pull: {images: src}});
    if(!result.modifiedCount){
        throw new Error("Something went wrong, no such document in the database.")
    }
}

productSchema.statics.add_image = async function(id, url){
    if(!id || !url) throw new Error("Please provide necessary information");
    const result = await this.updateOne({_id: id}, {$push : {images: url}});
    if(!result.modifiedCount){
        throw new Error("Something went wrongg, no such document in the database.");
    }
}

productSchema.statics.update_product = async function(id, updateObject){
    if(!id || !updateObject) throw new Error("Please provide all necessary data")
    const updatedProduct = await this.findByIdAndUpdate(id,{ $set: updateObject },{ new: true })
    console.log(updatedProduct);
    return updatedProduct;
}

productSchema.statics.get_single_product_details = async function(id){
    if(!id) throw new Error("Please provide all necessay details");
    const product = await this.findOne({_id: id});
    if(product) return product;
    else throw new Error("No such product listed.")
}

function imageValidation(val){
    return val.length >= 1
}

function findCurrPrice(actualPrice, discount){
    return actualPrice - ((actualPrice / 100) * discount);
}

function findDiscount(actualPrice, currentPrice){
    return Math.floor(((actualPrice - currentPrice) * 100) / actualPrice); 
}
module.exports = mongoose.model('products', productSchema);
