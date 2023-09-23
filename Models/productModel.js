const mongoose = require('mongoose');
const categoryModel = require("./categoryModel")

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
    }, 
    stock: {
        type: Number, 
        required: true
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

    console.log(productDetails)
    const newProduct = await this.create(productDetails);
    return newProduct;
}

    productSchema.statics.get_products = async function(p=0){
        const pageCount = 10;
        const products = await this.aggregate([{$match : {isDeleted: false}}, 
            {$lookup: {
                from: 'categories', 
                localField: 'category', 
                foreignField: '_id', 
                as: 'category'
            }}]).skip(p*pageCount).limit(pageCount);

        const totalProducts = await this.countDocuments({isDeleted: false})

        return {products, totalProducts};
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
    const updatedProduct = await this.findByIdAndUpdate(id,{ $set: updateObject },{ new: true }).populate('category')
    console.log(updatedProduct);
    return updatedProduct;
}

productSchema.statics.get_single_product_details = async function(id){
    if(!id) throw new Error("Please provide all necessay details");
    const product = await this.findOne({_id: id});
    if(product) return product;
    else throw new Error("No such product listed.")
}

productSchema.statics.get_search_result = async function(searchKey, page){
    const docPerPage = 10;
    const category = await categoryModel.find({category: { $regex: searchKey, $options: 'i' }}, {_id: 1})
    const categoryIds = category.map( x => x._id)
    console.log(categoryIds)
    const query = {
        $or: [
            {name: { $regex: searchKey, $options: 'i' }}, 
            { category : {$in : categoryIds}} // Case-insensitive search on name}, // Case-insensitive search on description
        ]   
            , isDeleted: false};
    
    const result = await this.find(query).skip(page * docPerPage).limit(docPerPage);
    const totalProducts = await this.countDocuments(query)
    return {products: result, totalProducts};
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

productSchema.statics.find_total_price = async function(productArray){
    if(!productArray) throw new Error("Please provide all the necessary fields");
    if(productArray.length == 0) throw new Error("Product cannot be empty");
    // const singleId = new mongoose.Types.ObjectId(productArray[0].products);
    // console.log(singleId)
    const resultProducts = await this.aggregate([{
            $match: {
                _id : {$in : productArray.map(x => new mongoose.Types.ObjectId(x.product))}
            }
        }])

    // every product in
    if(resultProducts.length != productArray.length) throw new Error("Something went wrong, couldn't add some produts to you order");
    // calculate price 
    const totalPrice = productArray.reduce( (acc, x) => {
        for(let i = 0;i < resultProducts.length; i++){
            if(x.product == resultProducts[i]._id) {
                acc.payable += resultProducts[i].currentPrice * x.quantity;
                acc.total += resultProducts[i].actualPrice * x.quantity; 
                acc.isFreeDelivery &&= resultProducts[i].isFreeDelivery
                return acc;
            } 
        }
    }, {isFreeDelivery: true, payable: 0, total: 0})
    // isFreeDelivery


    return totalPrice;
}


module.exports = mongoose.model('products', productSchema);
