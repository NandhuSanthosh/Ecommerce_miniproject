const mongoose = require('mongoose')

const couponSchema = new mongoose.Schema({
    code : {
        type: String, 
        required: true, 
        minlength: 4,
        unique: true
    }, 
    discount: {
        discountType: {
            type: String, 
            required: true,
            enum: ["percentage-discount", "amount-discount"]
        }, 
        percentage: {
            type: Number
        }, 
        amount: {
            type: Number
        }
    }, 
    expiry: {
        type: Date,
        required: true
    }, 
    minSpend: {
        type: Number, 
        default: 1
    }, 
    categories: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'categories'
    }], 
    usageLimit: {
        type: Number, 
        default: Infinity,
    }, 
    usedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users', 
    }], 
    numberOfCouponsUsed: {
        type: Number, 
        default: 0
    }, 
    isActive: {
        type: Boolean, 
        default: false
    }
}, { timestamps: { createdAt: 'created_at' } })


module.exports = mongoose.model("coupons", couponSchema);