const couponModal = require('../Models/couponModel')

exports.post_createCoupon = async function(req, res, next){
    try {
        let {code, discountType, percentage, amount, expiry, minSpend, categories, usageLimit} = req.body
        if(!code || !discountType || !expiry) throw new Error("Please enter necessary details.")
        if(discountType == "percentage-discount" && (percentage == undefined || percentage < 0 || percentage > 100)) throw new Error("Please enter discount percentage.")
        if(discountType == "amount-discount" && (amount == undefined || amount < 0)) throw new Error("Please enter discount amount.")


        code = code.toUpperCase();
        const isCodeAlreadyUsed = await couponModal.findOne({code});
        if(isCodeAlreadyUsed) throw new Error("The coupon code is already used.")

        const newCoupon = await couponModal.create({
            code, 
            discount: {
                discountType, 
                percentage, 
                amount
            }, 
            expiry,
            minSpend, 
            categories,
            usageLimit
        })

        res.send({isSuccess: true, data : newCoupon})
    } catch (error) {
        next(error)
    }
}


exports.patch_coupon = async function(req, res, next){
    try {
        const {couponId} = req.query
        if(!couponId) throw new Error("Please provide necessary information")

        let {code, discountType, percentage, amount, expiry, minSpend, categories, usageLimit} = req.body

        
        
        const updateQuery = {
            discount: {
                discountType, 
                percentage, 
                amount
            }, 
            expiry,
            minSpend, 
            categories,
            usageLimit
        }

        if(code){
            code = code.toUpperCase();
            const isCodeAlreadyUsed = await couponModal.findOne({code});
            if(isCodeAlreadyUsed) throw new Error("The coupon code is already used.")
            updateQuery.code = code;
        }


        const updatedCoupon = await couponModal.findByIdAndUpdate(couponId, {$set: updateQuery}, {new: true})
        res.send({isSuccess: true, data: updatedCoupon})
    } catch (error) {
        next(error)
    }
}

exports.get_coupons = async function(req, res, next){
    try {
        const coupons = await couponModal.find({});
        res.send({isSuccess: true, data: coupons})
    } catch (error) {
        next(error)
    }
}

exports.put_activateCoupon = async function(req, res, next){
    try {
        const {couponId} = req.query
        if(!couponId) throw new Error("Please provide necessary information")
        const updatedCoupon = await couponModal.findByIdAndUpdate(couponId, {$set: {isActive: true}}, {new: true})
        res.send({isSuccess: true, data: updatedCoupon})
    } catch (error) {
        next(error)
    }
}

exports.put_deactivateCoupon = async function(req, res, next){
    try {
        const {couponId} = req.query
        if(!couponId) throw new Error("Please provide necessary information")
        const updatedCoupon = await couponModal.findByIdAndUpdate(couponId, {$set: {isActive: false}}, {new: true})
        res.send({isSuccess: true, data: updatedCoupon})
    } catch (error) {
        next(error)
    }
}