const Razorpay = require('razorpay');
const { createHmac } = require('crypto')



var instance = new Razorpay({
  key_id : process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.post_create_order = (req, res, next)=>{
    try {
        const amount = req.body.amount * 100;
        var options = {
            amount,  // amount in the smallest currency unit
            currency: "INR",
        };
        instance.orders.create(options, function(err, order) {
            if(!err){
                console.log(order.id);
                res.send({isSuccess: true, orderId : order.id})
            }
            else{
                console.log(err)
                res.send({isSuccess: true})
            }
        });
    } catch (error) {
        next(error)
    }
}

exports.post_verify = (req, res, next)=>{
    let body = req.body.response.razorpay_order_id +
    '|' + req.body.response.razorpay_payment_id;


    var crypto = require("crypto");
    var expectedSignature =  createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                            .update(body.toString())
                            .digest('hex')


    if(expectedSignature == req.body.response.razorpay_signature){
        res.send({isSuccess: true})
    }
    else{
        res.send({isSuccess: false})
    }
}