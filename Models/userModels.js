const mongoose = require('mongoose');
const validate = require('validator');
const {phone} = require('phone');
const bcrypt = require('bcrypt')

// const mobileModel = mongoose.model('mobile', mobileSchema);

const userSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: [true, "Please enter the name"], 
    }
    ,credentials: {
        email: {
            type: String, 
            lowercase: true,
            required: [function(){
                return !this.credentials.mobile;
            }, "Email or Mobile required"]
        }, 
        mobile: {
            countryCode: {
                required: [function(){
                    return !this.credentials.email;
                }, "Email or Mobile required"],
                type: String,
            },
            number: {
                required: [function(){
                    return !this.credentials.email;
                }, ""] , 
                type: String, 
            }

        }
    }
    ,password: {
        type: String,
        required: [true, "Password not valid"],
    }
    ,createdAt:{
        type: Date, 
        immutable: true,
        default: ()=> Date.now()
    }
    ,isBlocked: {
        type: Boolean, 
        default: false
    }
    
})

userSchema.statics.validation = async function (userDetails) {
    let existingUser;

    try {
        // validating name
        if(!validateFullName(userDetails.name)){
            throw new Error("Please provide a valid name.");
        }
        
        // validate email and mobile
        if(userDetails.credentials.email){
            if(!validate.isEmail(userDetails.credentials.email)){
                throw new Error("Email is not valid.");
            }
        }
        else{
            console.log();
            let mobile = userDetails.credentials.mobile;
            if(!this.validatePhoneNumber(mobile.number, mobile.countryCode)){
                throw new Error("Please enter a valid mobile number!")
            }
        }

        await this.isAlreadyUsed(userDetails);

        // validating password
        if(!this.validatePassword(userDetails.password)){
            throw new Error("Please enter a valid password")
        }
    } catch (error) {
        error.errors = [{properties: { message : error.message }}]
        throw error;
    }
    
}

userSchema.statics.isAlreadyUsed = async function(userDetails){
        // validating email
        if(userDetails.credentials.email){
            existingUser = await this.findOne({ 'credentials.email': userDetails.credentials.email });
            if(existingUser){
                throw new Error("Email associated with another account.")
            }
        }
        else{
            let mobile = userDetails.credentials.mobile;
            existingUser = await this.findOne({
                'credentials.mobile' : mobile
            })
            if(existingUser){
                throw new Error("Phone number is associated with another account.");
            }

        }
}

userSchema.statics.validatePhoneNumber = function(phoneNumber, countryCode){
    const validationResult = phone(phoneNumber, countryCode);
    return validationResult.isValid;
}

userSchema.pre('save', async function(next){
    await this.constructor.isAlreadyUsed(this);
    this.password = await bcrypt.hash(this.password, 10);
    next();
})

function validateFullName(fullName){
    var regName = /^[a-zA-Z]+ [a-zA-Z]+$/;
    if(regName.test(fullName)){
        return true;
    }
    return false;
}

userSchema.statics.validatePassword = function(password){

    if(!password) return false

    const regexSpecialChar = /[^a-zA-Z0-9\s]/;
    const regexNumber = /\d/;

    const regexUppercase = /[A-Z]/;
    const regexLowercase = /[a-z]/;

    if(password == "") {  
        return false;  
    }  

    if(password.length < 8) {  
        return false;  
    }
    
    if(password.length > 15) {  
        return false;  
    }  
    
    if( !(regexUppercase.test(password) && regexLowercase.test(password))){
        return false;
    }

    if( !(regexNumber.test(password))){
        return false;
    }

    if( !regexSpecialChar.test(password)){
        return false;
    }

    return true;
}

userSchema.statics.login = async function(credentials, password){
    if(!credentials.email && !credentials.mobile){
        throw new Error("Please provide all the necessary data!");
    } 

    let user, result; 
    if(credentials.email){
        user = await this.findOne({"credentials.email": credentials.email})
    }
    else{
        user = await this.findOne({"credentials.mobile.number": credentials.mobile.number})
    }
    if(user){
        result = await bcrypt.compare(password, user.password);
    }

    if(!result){
        throw new Error("Email or password incorrect");
    }
    else{
        return user;
    }
}



module.exports = mongoose.model('Users', userSchema);