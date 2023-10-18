const Razorpay = require('razorpay');
const { createHmac } = require('crypto')
var crypto = require("crypto");


var instance = new Razorpay({
  key_id : process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

async function createOrder(amount){
    amount *= 100;
        var options = {
            amount,  // amount in the smallest currency unit
            currency: "INR",
        };
        let orderId
        await instance.orders.create(options, function(err, order) {
            if(!err){
                console.log("here")
                orderId = order.id;
            }
            else{
                throw new Error("There is some issue with create you payment order.")
            }
        });
        console.log("here2", orderId)
        return orderId
}

function verify_payment(response){
    let body = response.razorpay_order_id +
    '|' + response.razorpay_payment_id;


    var expectedSignature =  createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
                            .update(body.toString())
                            .digest('hex')


    if(expectedSignature == response.razorpay_signature){
        return true;
    }
    else{
        return false;
    }
}

module.exports = {verify_payment, createOrder}