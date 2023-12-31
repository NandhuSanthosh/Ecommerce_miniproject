const mongoose = require('mongoose');
const validate = require('validator');
const {phone} = require('phone');
const bcrypt = require('bcrypt');
const userCartModel = require('./userCartModel');
const ObjectId = mongoose.Types.ObjectId;
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
    ,isVerified: {
        type: Boolean, 
        default: false
    },
    address: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: "address"
    }], 
    cartId : {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Carts"
    },
    wishList: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: "products"
    }], 
    wallet: {
        balance: {
            type: Number, 
            min: 0, 
            default: 0
        }, 
        transactions: [{
            type: {
                type: String, 
                enum: ["credit", "debit"]
            },
            transactionId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "transactions"
            }, 
            beforeBalance: {
                type: Number, 
            }, 
            afterBalance: {
                type: Number, 
            }
        }]
    },
    referalCode: {
        type: String
    },
    referedBy: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "Users"
    }
})

userSchema.statics.validation = async function (userDetails) {

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
            let existingUser = await this.findOne({ 'credentials.email': userDetails.credentials.email });
            if(existingUser){
                throw new Error("Email associated with another account.")
            }
        }
        else{
            let mobile = userDetails.credentials.mobile;
            let existingUser = await this.findOne({
                'credentials.mobile' : mobile
            })
            if(existingUser){
                throw new Error("Phone number is associated with another account.");
            }

        }
}

userSchema.statics.isValidCredentail = async function(credentail){
    let existingUser
    if(credentail.email){
        existingUser = await this.findOne({ 'credentials.email': credentail.email });
        if(!existingUser){
            throw new Error("The email you provided is not associated with any account.")
        }
    }
    else{
        let mobile = credentail.mobile;
        existingUser = await this.findOne({
            'credentials.mobile.number' : mobile
        })
        if(!existingUser){
            throw new Error("The mobile number you provided is not associated with any account.");
        }
    }
    return existingUser.name
}

userSchema.statics.validatePhoneNumber = function(phoneNumber, countryCode){
    const validationResult = phone(phoneNumber, countryCode);
    return validationResult.isValid;
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

userSchema.statics.getAllUsers = async function(p=0){
    try {
        console.log(p)
        const documentPerPageCount = 10;
        const users = await this.find({}, {password: 0, createdAt: 0, __v: 0})
        .skip(p * documentPerPageCount).limit(documentPerPageCount);
        
        const totalUserCount = await this.countDocuments();
        return {users, totalUserCount};
    } catch (error) {
        throw error
    }
}

userSchema.pre('save', async function(next){
    await this.constructor.validation(this);
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

userSchema.statics.blockUser = async function(id){
    const filter = {_id: id}
    let user = await this.findOne(filter)
    if(!user) throw new Error("No document matched");

    const update = {isBlocked: !user.isBlocked}
    let status = await this.updateOne(filter, update);

    if(!status.modifiedCount) throw new Error("Something went wrong")
    return {status: user.isBlocked? "User succesfully unblocked" : "User succesfully blocked"}

}

userSchema.statics.verify = async function(id){
    const result = await this.updateOne({_id: id}, {$set: {isVerified: true}});
}

userSchema.statics.addAddress = async function(addressId, userId){
    const result = await this.findByIdAndUpdate(userId, {$push : {address: addressId}}, {new: true});
    return result;
}

userSchema.statics.getAddress = async function(id){
    console.log(id)
    const result = await this.aggregate([
        { 
            $match: { _id: new ObjectId(id) }
        }, {
            $unwind: {
                path: "$address"
            }
        }, {
            $lookup: {
                from: "addresses", 
                localField: "address", 
                foreignField: "_id", 
                as: "addresses"
            }
        }, {
            $project: {
                addresses: 1, 
                _id: 0
            }
        }
    ])
    console.log(result)
    const adderss = result.map(x => {
        return x.addresses[0]
    })
    return adderss;
}

userSchema.statics.deleteAddress = async function(userId, addressId){
    const result = await this.updateOne({_id: userId}, {$pull: {address: addressId}});
    if(!result.modifiedCount){
        if(result.matchedCount) throw new Error("The user doen't have such an address.")
        else throw new Error("There isn't such a user.")
    }
    return true;
}

userSchema.statics.update_name = async function(userId, newName){
    if(!newName) throw new Error("Please provide necessary information");
    if(!validateFullName(newName)) throw new Error("The name is not valid")
    const user = await this.findByIdAndUpdate(userId, {name: newName}, {new : true});
    if(!user) throw new Error("There is no such user.")
    return user
}

userSchema.statics.complete_userDetails = async function(id){
    if(!id) throw new Error("Please provide necessary information.");
    const user = await this.findById(id).populate('address')
    if(!user) throw new Error("There is no such user");
    return user;
}

userSchema.statics.change_password = async function(id, currPassword, newPassword){
    if(!currPassword || !newPassword) throw new Error("Please provide all the necessary details.")
    const {password} = await this.findById(id);
    if(!password) throw new Error("Something went wrong: invalid user id")

    const status = await bcrypt.compare(currPassword, password)
    if(!status) throw new Error("Incorrect password: The current password you entered is incorrect.")
    const newPasswordHash = await bcrypt.hash(newPassword, 10)
    const user = await this.findByIdAndUpdate(id, {password: newPasswordHash}, {new: true})
    return user;
}

userSchema.statics.update_password = async function(crednetail, newPassword){
    if(!crednetail || !newPassword) throw new Error("Please provide necessary details");
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    let searchQuery;
    if(isNaN(crednetail[0])){
        searchQuery = { "credentials.email" : crednetail}
    }
    else{
        searchQuery = {"credentials.mobile.number" : crednetail}
    }
    const user = await this.findOneAndUpdate(searchQuery, {$set: {password: hashedNewPassword}}, {new: true})
    if(!user) throw new Error("No such user, user credentail not valid")
    return user;
}

userSchema.statics.getCart = async function(userId){
    if(!userId) throw new Error("Please provide necessary information. 1")
    const userCart = await this.findById(userId, {cartId: 1, _id: 0});
    if(userCart.cartId){
        return userCart.cartId;
    }
    else{
        const newCart = await userCartModel.create({});
        console.log(newCart)
        const user = await this.findByIdAndUpdate(userId, {$set: {cartId : newCart._id}})
        return newCart._id;
    }
}

userSchema.statics.get_search_result = async function (searchKey, page = 0){
    const docPerPage = 10;
    const query = {
            name: { $regex: searchKey, $options: 'i' } // Case-insensitive search on name}, // Case-insensitive search on description
    };
    console.log(page)
    const result = await this.find(query).skip(page * docPerPage).limit(docPerPage);
    console.log(result)
    const totalUsers = await this.countDocuments(query)
    return {user: result, totalCount : totalUsers};
}



module.exports = mongoose.model('Users', userSchema);