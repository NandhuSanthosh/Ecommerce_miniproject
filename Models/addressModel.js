const mongoose = require('mongoose');
const {phone} = require('phone');

const addressSchema = new mongoose.Schema({
    fullName : {
        type: String, 
        required: true
    }, 
    mobileNumber: {
        type: String, 
        required: true
    }, 
    pincode: {
        type: String,
        required: true
    }, 
    addressLine1: {
        type : String, 
        required: true
    },
    addressLine2: {
        type: String, 
        required: true
    }, 
    landmark: {
        type : String, 
        required: true
    }, 
    town: {
        type: String, 
        requiredd: true
    }, 
    state: {
        type: String, 
        required: true
    }
})


addressSchema.pre('save', function(next){
    if(!validateFullName(this.fullName)){
        throw new Error("Please enter a valid fullname");
    }
    if(!validatePhoneNumber(this.mobileNumber)){
        throw new Error("Please enter a vlaid phone number")
    }
    if(!validatePinCode(this.pincode)){
        throw new Error("Please enter a valida pincode")
    }
    next();
})

addressSchema.statics.edit_address = async function(addressId, newDetails){
    console.log(addressId, newDetails)
    const result = await this.findOneAndUpdate({_id: addressId}, {$set: newDetails}, {new: true});
    return result;
}

function validateFullName(fullName){
    var regName = /^[a-zA-Z]+ [a-zA-Z]+$/;
    if(regName.test(fullName)){
        return true;
    }
    return false;
}
function validatePhoneNumber(number){
    const indianPhoneNumberRegex = /^[6789]\d{9}$/;
    return indianPhoneNumberRegex.test(number);
}
function validatePinCode(pincode){
    const indianPINCodeRegex = /^[1-9][0-9]{5}$/;
    return indianPINCodeRegex.test(pincode);
}


module.exports = new mongoose.model("address", addressSchema);