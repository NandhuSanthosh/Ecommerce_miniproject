const mongoose = require('mongoose')

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users', 
        required: true
    }, 
    userAddressId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "address", 
        // required: true,
    },
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'products',
            required: true
        }, 
        price : {
            type: Number, 
            required: true,
        },
        quantity: {
            type: Number, 
            default: 1
        }
    }], 
    totalPrice: {
        type: Number, 
        required: true
    },
    deliveryCharge: {
        type: Number, 
        default: 0
    },
    discount: {
        type: Number, 
        default: 0
    },
    isFreeDelivery: {
        type: Boolean, 
        default: false
    },
    paymentDetail: {
        method: {
            type: String, 
        }        
    },
    orderCreateAt: {
        type: Date, 
    }, 
    status: {
        type: String, 
        required: true
    }, 
    extimatedDeliveryDate: {
        type: Date, 
    }, 
    isDeleted: {
        type: Boolean, 
        default: false
    }
})

orderSchema.statics.create_new_order = async function (userId, products, totalPrice, isFreeDelivery, discount, deliveryCharge = 40) {
    console.log(userId, products, totalPrice, isFreeDelivery, discount, deliveryCharge)
    if(!userId || !products || !totalPrice || isFreeDelivery == undefined) throw new Error("Please provide all the necessary information");

    const orderCreateAt = new Date();
    const extimatedDeliveryDate = new Date();
    extimatedDeliveryDate.setDate(orderCreateAt.getDate() + 6);

    console.log(discount);
    const newDoc = {
        userId, 
        products, 
        totalPrice, 
        isFreeDelivery, 
        status : "Pending",
        deliveryCharge,
        discount, 
        orderCreateAt, 
        extimatedDeliveryDate
    }
    const newOrder = await this.create(newDoc)
    console.log(newOrder)
    return newOrder._id
}

orderSchema.statics.find_order_details = async function(id){
    if(!id) throw new Error("Please provide the necessary data");
    const doc = await this.findOne({_id: id, isDeleted: false});
    console.log(doc, id)
    return doc
}

orderSchema.statics.complete_order_handler = async function(id, addressId, paymentMethod){
    if(!id || !addressId || !paymentMethod) throw new Error("Please provide necessary information")
    const orderCreateAt = new Date();
    const extimatedDeliveryDate = new Date()
    extimatedDeliveryDate.setDate(orderCreateAt.getDate() + 5)
    const doc = await this.findByIdAndUpdate(id, {$set: {status: "Processing", userAddressId: addressId, "paymentDetail.method": paymentMethod, }}, {new: true})
    
    return doc;
}

orderSchema.statics.find_user_orders = async function(userId){
    if(!userId) throw new Error("Please provide all necessary informations.")
    const userOrders = await this.find({userId, isDeleted: false})
                        .populate("products.product")
                        .populate('userAddressId')
    console.log(userOrders + "is this realy here")
    return userOrders
}

orderSchema.statics.delete_order = async function(orderId){
    if(!orderId) throw new Error("Please provide necessary information.")
    const result = await this.findByIdAndUpdate(orderId, {$set: {isDeleted: true}})
}

module.exports = mongoose.model("Orders", orderSchema)