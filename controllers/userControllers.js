const { generateOtp, createOtpDocument } = require("../Middleware/authUtilMiddleware");
const { sendResponseMail, sendMailWithButton, sendPasswordResetMail } = require("../Middleware/sendMail");
const sendOtp = require("../Middleware/sendOtp");
const { ObjectId } = require('mongoose').Types;


const addressModel = require("../Models/addressModel");
const otpModel = require("../Models/otpModel");
const userModel = require("../Models/userModels")
const transactionModel = require("../Models/transactionsModel")

const forgotPasswordTokensModel = require('../Models/forgotPasswordModel')
const jwt = require("jsonwebtoken");
const productModel = require("../Models/productModel");
const { DomainConfigMessagingServiceContextImpl } = require("twilio/lib/rest/messaging/v1/domainConfigMessagingService");
const { createOrder, verify_payment } = require("../Middleware/onlinePayment");

const associate = "user";

exports.get_home = async function(req, res){
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.render('./authViews/userHome.ejs', {product: {}})
}



const twoPFiveSeconds = 2.5 * 60 // seconds
const threeDaysSeconds = 3 * 24 * 60 * 60;

function createToken(userDetails, maxAge, status, id){
    console.log(status)
    return jwt.sign({
        userDetails, 
        status,
        id
    }, process.env.JWT_KEY, {
        expiresIn: maxAge 
    })
}


exports.get_login = (req, res)=>{
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.render("authViews/signup-login", {page: "login", associate})
}

// 
exports.get_signup = (req, res)=>{
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.render('authViews/signup-login', {page : "signup", associate, superSet: "signup"})
}



exports.post_login = async(req, res, next)=> {
    const {credentials, password} = req.body;
    try {
        if( (!credentials.email && !credentials.mobile) || !password){
            throw new Error("Please provide necessary informations.")
        }
        const result = await userModel.login(credentials, password);
        const {response, id} = await sentOtpHelper({userDetails: result});
        response.then( d=> {
            const jwtToken = createToken({_id: result._id ,credentials: result.credentials, name: result.name}, twoPFiveSeconds, "awaiting-otp", id);
            console.log(jwtToken)
            res.cookie('uDAO', jwtToken, { maxAge: twoPFiveSeconds * 1000 ,  httpOnly: true});
            
            res.send({isSuccess: true})
        })
        .catch( e => {
            next(e);
        })
    } catch (error) {
        res.send({isSuccess: false, errorMessage: error.message})
    }
}

exports.get_logout = async(req, res, next) =>{
    try {
        res.clearCookie("uDAO");
        res.redirect("./login")
    } catch (error) {
        next(error)
    }
}


exports.get_otpAuthPage = async (req, res)=>{
    console.log("here")
    const superSet = req.query.superSet
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.render('authViews/signup-login', {page: "otpAuth", associate, superSet})
}


exports.post_signin = async(req, res, next) => {
    const userDetails = req.body;
    try{
        const user = await userModel.create(userDetails);

        const {response, id} = await sentOtpHelper({userDetails: user});
        response.then( d => {
            const jwtToken = createToken({_id: user._id, credentials: result.credentials, name: result.name}, twoPFiveSeconds, "awaiting-otp", id);
            res.cookie('uDAO', jwtToken, { maxAge: twoPFiveSeconds * 1000 ,  httpOnly: true});    
            res.send({isSuccess: true, jwtToken})
        })
        .catch( e => {
            next(e);
        })      
    }
    catch(error){
        next(error);
    }
    
    // res.send("here")
}

exports.get_otp = async(req, res) => {
    const result = req.userDetails;
    const {response, id} =await sentOtpHelper(result);
    response.then( d => {
        const jwtToken = createToken({_id: result.userDetails._id, credentials: result.userDetails.credentials, name: result.userDetails.name}, twoPFiveSeconds, "awaiting-otp", id);
        res.cookie('uDAO', jwtToken, { maxAge: twoPFiveSeconds * 1000 ,  httpOnly: true});                
        res.send({isSuccess: true})
    })
    .catch (error => {
        res.send({isSuccess: false, errorMessage: error.message})
    })
}

async function sentOtpHelper(result){
    const { id, otp} = await createOtpDocument(result.userDetails.credentials.email ? result.userDetails.credentials.email : result.userDetails.credentials.mobile.number, "user")
        const message = `${otp} is the One Time Password(OTP) for registration. OTP is valid for next 2 minutes and 30 seconds. Plese do not share with anyone`;
        if(result.userDetails.credentials.email){
            return {id, response: sendResponseMail(message, otp, result.userDetails.credentials.email, result.userDetails.name)}

        }else{
            // return {id, response: sendOtp(message)}
            console.log(otp)
            return {id, response: new Promise((res, rej)=>{res()})}
        }
}


exports.post_verifyOtp = async(req, res) => {
    // find the doucment using user cookie
    const {otp} = req.body;
    try {
        const result = req.userDetails;
        const otpDoc = await otpModel.findDoc(result.id, otp);

        const {userDetails} = result;
        if(!userDetails.isVerified){
            userModel.verify(userDetails._id)
        }
        const jwtToken = createToken({_id: userDetails._id, credentials: userDetails.credentials, name: userDetails.name}, threeDaysSeconds, "loggedIn");
        res.cookie('uDAO', jwtToken, { maxAge: 3 * 24 * 60 * 60 * 1000 ,  httpOnly: true});
        res.send({isSuccess: true})
    } catch (error) {
        res.send({isSuccess: false, errorMessage: error.message})
    }
}

exports.get_forgotPassword = async(req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.render("authViews/signup-login", {page: "forgot-password", associate})
}

exports.post_forgotPassword = async(req, res, next)=>{
    try {
        const {credentail} = req.body;
        const userName = await userModel.isValidCredentail(credentail);
        const newToken = await forgotPasswordTokensModel.create_new_token(credentail.email || credentail.mobile)
        if(credentail.email){
            const link = "http://localhost:3000/reset_password/"+newToken.key
            sendPasswordResetMail(userName, link, credentail.email)
        }
    } catch (error) {
        next(error)
    }
}

exports.get_resetPassword = async(req, res, next)=>{
    try {
        // take key
        const key = req.params.key
        const email = await forgotPasswordTokensModel.validate_key(key);
        res.render('authViews/resetPasswordPage', {key, associate});
    } catch (error) {
        next(error);
    }
}

exports.post_resetPassword = async(req, res, next)=>{
    try {
        const {newPassword} = req.body
        const key = req.params.key
        const credentail = await forgotPasswordTokensModel.validate_key(key)
        const user = await userModel.update_password(credentail, newPassword)
        await forgotPasswordTokensModel.expire_token(credentail)
        const jwtToken = createToken({_id: user._id, credentials: user.credentials, name: user.name}, threeDaysSeconds, "loggedIn");
        res.cookie('uDAO', jwtToken, { maxAge: 3 * 24 * 60 * 60 * 1000 ,  httpOnly: true});
        res.send({isSuccess: true})
    } catch (error) {
        next(error)
    }
}



exports.get_settings = async(req, res, next) =>{
    try {
        const userId = req.userDetails.userDetails._id;
        const addresses = await userModel.getAddress(userId);
        res.render('authViews/settings', {userDetails: req.userDetails.userDetails, addresses})
    } catch (error) {
        next(error);
    }

}

exports.post_addAddress = async(req, res, next)=>{
    try {
        const {addressDetails} = req.body;
        const userId = req.userDetails.userDetails._id;
        const newAddress = await addressModel.create(addressDetails);
        const updatedUser = await userModel.addAddress(newAddress._id, userId);
        res.send({isSuccess: true, newAddress, updatedUser});
    } catch (error) {
        next(error)
    }
}

exports.get_allAddress = async (req, res, next)=>{
    try {
        const userId = req.userDetails.userDetails._id;
        const addresses = await userModel.getAddress(userId);
        res.send({isSuccess: true, addresses})
    } catch (error) {
        next(error);
    }
}

exports.delete_address = async (req, res, next)=>{
    try {
        const userId = req.userDetails.userDetails._id;
        const addressId = req.params.id
        const result = await userModel.deleteAddress(userId, addressId);
        res.send({isSuccess: true})
    } catch (error) {
        next(error)
    }
}

exports.patch_address = async(req, res, next)=>{
    try {
        const addressId = req.params.id
        const {updatedData} = req.body
        const result = await addressModel.edit_address(addressId, updatedData)
        res.send({isSuccess: true, data: result})
    } catch (error) {
        next(error)
    }
}

exports.patch_updateName = async(req, res, next)=>{
    try {
        const id = req.userDetails.userDetails._id;
        const newName = req.body.name;
        console.log(newName)
        const user = await userModel.update_name(id, newName);
        const jwtToken = createToken({_id: user._id, credentials: user.credentials, name: user.name},  threeDaysSeconds, "loggedIn");
        res.cookie('uDAO', jwtToken, { maxAge: 3 * 24 * 60 * 60 * 1000 ,  httpOnly: true});
        res.send({isSuccess: true, user})
    } catch (error) {
        next(error)
    }
}

exports.patch_changePassword = async(req, res, next)=>{
    try {
        const {currentPassword, newPassword} = req.body;
        const result = await userModel.change_password(req.userDetails.userDetails._id, currentPassword, newPassword)
        console.log(result)
        res.send({isSuccess: true, result})
    } catch (error) {
        next(error)
    }
}


// WISH LIST
exports.post_addToWishList = async(req, res, next) => {
    try {
        const userId = req.userDetails.userDetails._id;
        const productId = req.query.productId;

        const product = await productModel.findById(productId);
        if(!product) throw new Error("Invalid product ID")
        
        const updatedUserDetails = await userModel.updateOne({_id: userId}, {$addToSet: {wishList: productId}})
        
        const isAdded = updatedUserDetails.modifiedCount;
        if(!isAdded){
            await userModel.updateOne({_id: userId}, {$pull: {wishList: productId}})
        }

        res.send({isSuccess: true, isAdded})
    } catch (error) {
        next(error)
    }
}

exports.post_removeFromWishList = async(req, res, next) => {
    try {
        const productId = req.query.productId;
        const userId = req.userDetails.userDetails._id;
        if(!productId) throw new Error("Please provide necessary information.")
        const updatedUser = await userModel.findByIdAndUpdate(userId, {$pull: {wishList: productId}})
        res.send({isSuccess: true})
    } catch (error) {
        next(error)
    }
}

exports.get_wishList = async(req, res, next)  => {
    try {
        const userId = req.userDetails.userDetails._id;
        const userDetails = await userModel.findById(userId)
        .populate("wishList", {
            name: 1, 
            images: 1, 
            currentPrice: 1,
            isFreeDelivery: 1,
            warranty: 1
        })
        res.render('./authViews/userHome.ejs', {page: "wishList-page", product: userDetails.wishList})
    } catch (error) {
        next(error)
    }
}


// WALLET
exports.get_wallet = async(req, res, next) => {
    try {
        const {userDetails} =  req.userDetails
        let user = await userModel.findById(userDetails._id, {credentials: 1, wallet: 1});
        res.render('authViews/userHome',  {page: "wallet", balance: user.wallet?.balance || 0, credential:  user.credentials.email || user.credentials.mobile.number})
    } catch (error) {
        next(error)
    }
}
exports.get_userWallet = async(req, res, next) => {
    try {
        const credentail = req.query.userCredential
        const user = await userModel.findOne({ 
            $or: [{
                "credentials.email" : credentail
            }, {
                "credentials.mobile.number" : credentail
            }]
        }, {
            name: 1
        })
        if(user) res.send({isSuccess: true, data: user});
        else throw new Error("There is no such user.");
    } catch (error) {
        next(error)
    }
}

exports.get_transactionHistory = async(req, res, next) => {
    try {
        const pageNo = req.query.pno;
        const currentWindow = req.query.currentWindow
        const docPerPage = 10;
        const {userDetails} = req.userDetails

        let windowFilterQuery = {}; 
        if(currentWindow){
            windowFilterQuery = {
                "wallet.transactions.transactionId.category" : currentWindow
            }   
        }
        console.log(req.query)
        console.log(windowFilterQuery)
        
        const pipeline = [
            {
                $match: { _id: new ObjectId(userDetails._id) }
            },
            {
                $unwind: '$wallet.transactions'
            },
            {
                $lookup: {
                    from: 'transactions', // Replace with your actual transactions collection name
                    localField: 'wallet.transactions.transactionId',
                    foreignField: '_id',
                    as: 'wallet.transactions.transactionId'
                }
            },
            {
                $unwind: '$wallet.transactions.transactionId'
            },
            {
                $match: windowFilterQuery
            }
            // {
            //     $lookup: {
            //         from: 'Users', 
            //         localField: "wallet.transactions.transactionId.receiverID", 
            //         foreignField: "_id", 
            //         as: "wallet.transactions.transactionId.receiverID"
            //     }
            // },  
            // {
            //     $lookup: {
            //         from: 'Users', 
            //         localField: "wallet.transactions.transactionId.senderID", 
            //         foreignField: "_id", 
            //         as: "wallet.transactions.transactionId.senderID"
            //     }
            // },  
            ,{
                $sort: {
                    "wallet.transactions.transactionId.timestamp": -1
                }
            },
            {
                $project: {
                    wallet: 1,
                }
            },
            {
                $skip: pageNo * docPerPage
            },
            {
                $limit: docPerPage
            },
            {
                $group: {
                    _id: null, 
                    transactions: {$push: "$wallet"}, 
                }
            }, 
        ];

        const pipeline2 = [
            {
                $match: { _id: new ObjectId(userDetails._id) }
            },
            {
                $unwind: '$wallet.transactions'
            },
            {
                $lookup: {
                    from: 'transactions', // Replace with your actual transactions collection name
                    localField: 'wallet.transactions.transactionId',
                    foreignField: '_id',
                    as: 'wallet.transactions.transactionId'
                }
            },
            {
                $unwind: '$wallet.transactions.transactionId'
            },
            {
                $match: windowFilterQuery
            },{
                $group: {
                    _id: null, 
                    count: {$sum: 1}
                }
            }
        ]

        const user = await userModel.aggregate(pipeline)
        const totalCount = await userModel.aggregate(pipeline2)

        res.send({isSuccess: true, data: user[0], totalCount: totalCount[0]})
    } catch (error) {   
        next(error)
    }
}

exports.get_wallet_balance = async(req, res, next) => {
    try {
        const {userDetails} = req.userDetails
        const userId = userDetails._id;
        const user = await userModel.findById(userId, {"wallet.balance" : 1});
        res.send({isSuccess: true, data: {balance : user.wallet.balance}})
    } catch (error) {
        
    }
}

exports.create_paymentOrder = async(req, res, next) => {
    try {
        const amount = req.body.amount;
        if(amount <= 0) throw new Error("The amount is not valid")
        const orderId = await createOrder(amount)
        console.log(orderId)
        res.send({isSuccess: true, orderId})
    } catch (error) {
        next(error)
    }
}

exports.verify_payment = async (req, res, next) =>{
    try {
        if(verify_payment(req.body.response)){
            const {amount} = req.body
            const userId = req.userDetails.userDetails._id;
            const transaction = await transactionModel.create({
                amount : amount, 
                timestamp : new Date(),
                senderID : userId, 
                category : "addToWallet"
            })
            let user = await userModel.findById(userId)
            const newBalance = user.wallet.balance + amount;
            const transactionDoc = {
                type: "credit",
                transactionId: transaction._id, 
                beforeBalance: user.wallet.balance, 
                afterBalance: newBalance
            };
            console.log(transactionDoc)
            user.wallet.transactions.push(transactionDoc)

            user = await userModel.findByIdAndUpdate(user._id, {$set: {"wallet.balance" : newBalance}, $push: {"wallet.transactions" : transactionDoc}})
            console.log(user);
            res.send({isSuccess: true, data: newBalance})
        }
        else{
            throw new Error("Payment verification failed.")
        }
    } catch (error) {
        next(error);
    }

}

exports.post_sentToUser = async(req, res, next) => {
    try {
        const senderID = req.userDetails.userDetails._id
        const {receiverID, amount} = req.body;

        console.log(senderID, receiverID, amount)

        if(!receiverID || !amount) throw new Error("Please provide necessary details");

        const receiver = await userModel.findById(receiverID);
        if(!receiver) throw new Error("There is no such user.")

        const sender = await userModel.findById(senderID);
        if(sender.wallet.balance < amount) throw new Error("Insuffcient balance.")

        const transaction = await transactionModel.create({
            amount, 
            timestamp: new Date(), 
            senderID, 
            receiverID,
            category: "betweenUsers"
        })

        const senderTransactionDoc = {
            type: "debit", 
            transactionId: transaction._id, 
            beforeBalance: sender.wallet.balance,
            afterBalance: sender.wallet.balance - amount
        }
        const receiverTransactionDoc = {
            type: "credit", 
            transactionId: transaction._id, 
            beforeBalance: receiver.wallet?.balance || 0,
            afterBalance: (receiver.wallet?.balance || 0) + amount
        }
        const updatedSender = await userModel.findByIdAndUpdate(senderID, {$set: {"wallet.balance" : sender.wallet.balance - amount}, $push: {"wallet.transactions" : senderTransactionDoc}}, {new: true})
        const updatedReceiver = await userModel.findByIdAndUpdate(receiverID, {$set: {"wallet.balance" : receiver.wallet.balance + amount}, $push: {"wallet.transactions" : receiverTransactionDoc}}, {new: true})
        
        console.log(updatedSender, updatedReceiver)
        res.send({isSuccess: true, data: updatedSender.wallet.balance})
    } catch (error) {
        next(error)
    }
}




