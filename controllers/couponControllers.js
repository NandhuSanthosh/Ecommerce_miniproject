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

        let newCoupon = await couponModal.create({
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
        
        newCoupn = await newCoupon.populate("usedUsers", {
            credentials: 1
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

        let discountUpdateQuery = {}
        console.log(req.body)
        if(discountType == 'percentage-discount'){
            if(!percentage) throw new Error("Please provide percentage when changing the discount type to percentage-discount.")
            if(percentage > 100 || percentage < 0) throw new Error("Please enter a valid percentage")
            discountUpdateQuery = {
                "discount.discountType" : discountType, 
                "discount.percentage" : percentage, 
                "discount.amount" : null
            }
        }
        else if(discountType == "amount-discount"){
            if(!amount) throw new Error("Please provide amount when changing the discount type to amount-discount.")
            if(amount < 0) throw new Error("Please enter a valid discount amount.")
            discountUpdateQuery = {
                "discount.discountType" : discountType,
                "discount.amount" : amount, 
                "discount.percentage" : null
            }
        }
        else if(percentage){
            if(percentage > 100 || percentage < 0) throw new Error("Please enter a valid percentage")
            discountUpdateQuery = {
                "discount.percentage" : percentage 
            }
        }
        else if(amount){
            if(amount < 0) throw new Error("Please enter a valid discount amount.")
            discountUpdateQuery = { 
                "discount.amount" : amount
            }
        }


        await couponModal.findByIdAndUpdate(couponId, {$set: discountUpdateQuery}, {new: true})
        const updatedCoupon = await couponModal.findByIdAndUpdate(couponId, {$set: updateQuery}, {new: true})


        res.send({isSuccess: true, data: updatedCoupon})
    } catch (error) {
        next(error)
    }
}

exports.get_coupons = async function(req, res, next){
    try {
        let pno = req.query.pno || 0;
        const documentPerPage = 10;
        const coupons = await couponModal.find({})
                        .skip(pno * documentPerPage)
                        .limit(documentPerPage)
                        .populate("categories", {
                            category: 1
                        })
                        .populate("usedUsers", {
                            credentials: 1
                        })
        const totalCount = await couponModal.countDocuments();
        res.send({isSuccess: true, data: coupons, totalCount})
    } catch (error) {
        next(error)
    }
}

exports.get_coupons_search_result = async function(req, res, next){
    try {
        let pno = req.query.pno || 0;
        const searchKey = req.query.searchKey
        if(!searchKey) throw new Error("Provide valida search key.")
        const documentPerPage = 10;

        const query = {code: { $regex: searchKey, $options: 'i' }};
        const coupons = await couponModal.find(query)
                                .skip(pno * documentPerPage)
                                .limit(documentPerPage)
                                
        const totalCount = await couponModal.find(query).countDocuments();
        res.send({isSuccess: true, data: coupons, totalCount})
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


