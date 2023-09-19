const mongoose = require('mongoose')


const orderStages = ["Order Pending", "Preparing to Dispatch", "Dispatched", 
"Out for Delivery", "Delivered", "Canceled", "Return Request Processing", 
"Return Request Granted", "Returned Completed"];

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users', 
        required: true
    }, 
    userCredential: {
        type: String
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
        productName: {
            type: String, 
            required: true,
        },
        price : {
            type: Number, 
            required: true,
        },
        quantity: {
            type: Number, 
            default: 1
        },
        coupon:{
            discount: {
                type: Number, 
                default: 0
            }
        },
        payable: {
            type: Number
        }
    }], 
    totalPrice: {
        type: Number, 
        required: true
    },
    discount: {
        type: Number, 
        default: 0
    },
    delivery: {
        isFreeDelivery: {
            type: Boolean, 
            default: false
        },
        deliveryCharge: {
            type: Number
        }
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
        required: true, 
        enum: [...orderStages]
    }, 
    extimatedDeliveryDate: {
        type: Date, 
    }, 
    cancelation : {
        cancledBy: {
            type: String, 
            enum: ['user', 'admin']
        },
        cancelationReason: {
            type: String
        }
    },
    returned: {
        returnedInitiatedBy: {
            type: String, 
            enum: ['user', 'admin']
        },
        returnReason: {
            type: String
        }
    },
    coupon: {
        code: {
            type: String
        }, 
        discount: {
            discountType: {
                type: String, 
                enum: ["percentage-discount", "amount-discount", null], 
            }, 
            percentage: {
                type: Number
            }, 
            amount: {
                type: Number
            }
        }, 
        discountAmount: {
            type: Number, 
            default: 0
        }
    },
    payable: {
        type: Number, 
        required: true
    }
})

orderSchema.statics.create_new_order = async function (userId, userCredential, products, totalPrice, discount, isFreeDelivery, deliveryCharge = 40) {
    if(!userId || !products || !totalPrice || isFreeDelivery == undefined) throw new Error("Please provide all the necessary information");

    const orderCreateAt = new Date();
    const extimatedDeliveryDate = new Date();
    extimatedDeliveryDate.setDate(orderCreateAt.getDate() + 6);

    let payable = totalPrice - discount;

    if(!isFreeDelivery){
        payable += deliveryCharge;
    }

    const newDoc = {
        userId, 
        userCredential,
        products, 
        totalPrice, 
        isFreeDelivery, 
        status : "Order Pending",
        delivery: {
            isFreeDelivery, 
            deliveryCharge
        },
        payable,
        discount, 
        orderCreateAt, 
        extimatedDeliveryDate
    }


    const newOrder = await this.create(newDoc)
    return newOrder._id
}

orderSchema.statics.find_order_details = async function(id){
    if(!id) throw new Error("Please provide the necessary data");
    const doc = await this.findOne({_id: id});
    return doc
}

orderSchema.statics.complete_order_handler = async function(id, addressId, paymentMethod){
    if(!id || !addressId || !paymentMethod) throw new Error("Please provide necessary information")
    const orderCreateAt = new Date();
    const extimatedDeliveryDate = new Date()
    extimatedDeliveryDate.setDate(orderCreateAt.getDate() + 5)
    const doc = await this.findByIdAndUpdate(id, {$set: {status: "Order Pending", userAddressId: addressId, "paymentDetail.method": paymentMethod, }}, {new: true})
    
    return doc;
}

orderSchema.statics.find_user_orders = async function(userId){
    if(!userId) throw new Error("Please provide all necessary informations.")
    const userOrders = await this.find({userId})
                        .populate("products.product")
                        .populate('userAddressId')
    return userOrders
}

orderSchema.statics.cancel_order = async function(orderId, reason){
    if(!orderId || !reason) throw new Error("Please provide necessary information.")
    const order = await this.findById(orderId);

    if(["Order Pending", "Preparing to Dispatch", "Dispatched", "Out for Delivery"].includes(order.status)){
        let updateQuery = {
            cancelation: {
                cancledBy: "user", 
                cancelationReason: reason,
            }, 
            status: "Canceled"
        }

        const order = this.findByIdAndUpdate(orderId, {$set: updateQuery,}, {new: true})
        return order;

    }
    else{
        throw new Error("You order is not in a state where it can be canceled.")
    }
    // const result = await this.findByIdAndUpdate(orderId, {$set: {isDeleted: true}})
}

orderSchema.statics.return_order = async function(orderId, reason){
    if(!orderId || !reason) throw new Error("Please provide necessary information.")
    const order = await this.findById(orderId);

    if(["Delivered"].includes(order.status)){

        const deliveryDate = new Date(order.extimatedDeliveryDate);
        const currentDate = new Date();

        const timeDifferenceInMilliSecond = currentDate - deliveryDate;
        const milliSecondsInADay = 24 * 60 * 60 * 1000;
        const timeDifferenceInDays = timeDifferenceInMilliSecond / milliSecondsInADay;
        console.log(timeDifferenceInDays)
        if(timeDifferenceInDays > 7){
            throw new Error("Order is no longer eligible for returns as it has been more than 7 days since the delivery date.")
        }


        let updateQuery = {
            returned: {
                returnedInitiatedBy: "user", 
                returnReason: reason,
            }, 
            status: "Return Request Processing"
        }

        const updatedOrder = this.findByIdAndUpdate(orderId, {$set: updateQuery,}, {new: true})
        return updatedOrder;
    }
    else{
        throw new Error("You order is not in a state where it can be returned.")
    }
}
orderSchema.statics.cancel_return_request = async function(orderId){
    if(!orderId) throw new Error("Please provide necessary information.")
    const order = await this.findById(orderId);

    if(["Return Request Processing", "Return Request Granted"].includes(order.status)){
        let updateQuery = {
            returned: {}, 
            status: "Delivered"
        }
        const updatedOrder = this.findByIdAndUpdate(orderId, {$set: updateQuery,}, {new: true})
        return updatedOrder;
    }
    else{
        throw new Error("You order is not in a state where it can be returned.")
    }
}





// ADMIN
orderSchema.statics.find_all_order = async function(p = 0){
   const pageCount = 10;
    const products = await this.find({}, {products: 1, userId: 1, totalPrice: 1, status: 1, userCredential: 1})
    .populate({
        path: "products.product", 
        select: "name images",
        options: {
            select: {
                images: { $slice: ['$images', 1] }
            }
        }
    })
    .skip(p*pageCount).limit(pageCount);

    const totalProducts = await this.countDocuments()
    return {data:products, totalCount: totalProducts};
}
orderSchema.statics.fetch_all_stages = async function(){
    return orderStages;
}
orderSchema.statics.update_order_status = async function(orderId, status, reason){
    if(!orderId || !status) throw new Error("Please provide necessary informations");
    if(!orderStages.includes(status)) throw new Error("Invalid status")
    if((status == 'Canceled' || status == "Return Request Processing" || status == "Return Request Granted" || status == "Returned Completed") && !reason) 
        throw new Error("To process cannot be completed without specify cancelation reason")
    
    const updateQuery = {status}
    if(status == "Canceled"){
        updateQuery.cancelation ={
            cancledBy: "admin", 
            cancelationReason: reason,
        }
        updateQuery.returned = {}
    }
    else if(status == 'Delivered'){
        updateQuery.extimatedDeliveryDate = new Date();
        updateQuery.cancelation = {}
        updateQuery.returned = {}
    }
    else if(status == "Return Request Processing" || status == "Return Request Granted" || status == "Returned Completed"){
        updateQuery.returned = {
            returnedInitiatedBy: "admin", 
            returnReason : reason
        }
    }

    const updatedOrder = await this.findByIdAndUpdate(orderId, {$set: updateQuery}, {new: true})
    .populate("userId", "name")
    .populate({
        path: "products.product", 
        select: "brand modelName images",
        options: {
            select: {
                images: { $slice: ['$images', 1] }
            }
        }
    })
    .populate("userAddressId")
    if(updatedOrder.status != "Canceled" && Object.keys(updatedOrder.cancelation).length != 0){
        updatedOrder.cancelation = {}
        await updatedOrder.save();
    }
    return updatedOrder
}
orderSchema.statics.update_extimated_date = async function (orderId, extimatedDate) {
    if(!orderId || !extimatedDate) throw new Error("Please provide all the necessary details")
    

    const order = await this.findById(orderId);
    if(order.status != "Dispatched") throw new Error("Order not elibible to change delivery date, order must be in the DESPATCH state.")
    let extimatedDeliveryDate;
    try {
        extimatedDeliveryDate = new Date(extimatedDate)
    } catch (error) {
        throw error
    }
    const currentDate = new Date();
    if(extimatedDeliveryDate < currentDate) throw new Error("Invalid date: the date is in the past.")
    const updatedOrder = await this.findByIdAndUpdate(orderId, {$set: {extimatedDeliveryDate: extimatedDate}}, {new: true})
    return updatedOrder;
}

orderSchema.statics.get_search_result = async function(searchKey, page = 0){
    const docPerPage = 10;
    const query = {
        $or: [{
                userCredential: { $regex: searchKey, $options: 'i' } // Case-insensitive search on name}, // Case-insensitive search on description
            }, {
                "products.productName" : { $regex: searchKey, $options: 'i' }
            }
        ]}
    
    const result = await this.find(query)
    .populate({
        path: "products.product", 
        select: "name images",
        options: {
            select: {
                images: { $slice: ['$images', 1] }
            }
        }
    }).skip(page * docPerPage).limit(docPerPage);
    const totalOrders = await this.countDocuments(query)
    return {orders: result, totalOrders};
}

orderSchema.statics.complete_order_details = async function(id){
    if(!id) throw new Error("Please provide all necessary data.")
    const order = await this.findById(id)
    .populate("userId", "name")
    .populate({
        path: "products.product", 
        select: "brand modelName images",
        options: {
            select: {
                images: { $slice: ['$images', 1] }
            }
        }
    })
.populate("userAddressId")

    return order;
}


module.exports = mongoose.model("Orders", orderSchema)