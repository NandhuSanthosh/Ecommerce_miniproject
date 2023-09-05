const { generateOtp, createOtpDocument } = require("../Middleware/authUtilMiddleware");
const { sendResponseMail, sendMailWithButton, sendPasswordResetMail } = require("../Middleware/sendMail");
const sendOtp = require("../Middleware/sendOtp");
const addressModel = require("../Models/addressModel");
const otpModel = require("../Models/otpModel");
const userModel = require("../Models/userModels")
const forgotPasswordTokensModel = require('../Models/forgotPasswordModel')
const jwt = require("jsonwebtoken")

const associate = "user";

exports.get_home = async function(req, res){
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.render('./authViews/userHome.ejs')
}



const twoPFiveSeconds = 2.5 * 60 // seconds
const threeDaysSeconds = 3 * 24 * 60 * 60;

function createToken(userDetails, maxAge, status, id){
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



exports.post_login = async(req, res)=> {
    const {credentials, password} = req.body;
    try {
        if( (!credentials.email && !credentials.mobile) || !password){
            throw new Error("Please provide necessary informations.")
        }
        const result = await userModel.login(credentials, password);
        const {response, id} = await sentOtpHelper({userDetails: result});
        response.then( d=> {
            const jwtToken = createToken(result, twoPFiveSeconds, "awaiting-otp", id);
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


exports.get_otpAuthPage = async (req, res)=>{
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
            const jwtToken = createToken(user, twoPFiveSeconds, "awaiting-otp", id);
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
        const jwtToken = createToken(result.userDetails, twoPFiveSeconds, "awaiting-otp", id);
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
            return {id, response: sendOtp(message)}
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
        const jwtToken = createToken(userDetails, threeDaysSeconds, "loggedIn");
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
        res.render('authViews/resetPasswordPage', {key});
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
        const jwtToken = createToken(user, threeDaysSeconds, "loggedIn");
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
        const jwtToken = createToken(user,  threeDaysSeconds, "loggedIn");
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


