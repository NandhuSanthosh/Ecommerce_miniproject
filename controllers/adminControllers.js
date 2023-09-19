const jwt = require('jsonwebtoken')

const adminModel = require('../Models/adminModel');
const {  createOtpDocument } = require('../Middleware/authUtilMiddleware');
const { sendResponseMail, sendPasswordResetMail } = require("../Middleware/sendMail");

const otpModel = require('../Models/otpModel');
const userModels = require('../Models/userModels');
const categoryModel = require('../Models/categoryModel')
const forgotPasswordTokensModel = require('../Models/forgotPasswordModel')

const awaitingOtpStatus = "awaiting_otp";
const loggedStats = "logged"
const associate = 'admin'

const twoPFiveSeconds = 2.5 * 60 // seconds
const threeDaysSeconds = 3 * 24 * 60 * 60;

function createToken(userDetails, maxAge, status, id){
    const obj = {
        userDetails, 
        status,
        id
    }
    return jwt.sign(obj, process.env.JWT_ADMIN_KEY, {
        expiresIn: maxAge 
    })
}


exports.post_adminLogin = async function (req, res){
    const {credentials, password} = req.body
    console.log(req.body);
    try {
        if(!credentials.email || !password) throw new Error("Provide proper details");
        const user = await adminModel.login(credentials, password);
        // set jwt token
        const {id, response} = await setOtpHelper({userDetails: user});
        response.then( d=> {
            const token = createToken(user, threeDaysSeconds, awaitingOtpStatus, id)
            res.cookie('aDAO', token)
            res.send({isSuccess: true})
        })
    } catch (error) {
        res.send({isSuccess: false, errorMessage: error.message})
    }
}

exports.get_adminHome = async function (req, res){

    res.render("adminViews/adminDashboard")
}

exports.get_adminLogin = async function (req, res){

    res.render('authViews/signup-login', {page: "login", associate: "admin"})
}

exports.get_otpAuth = async function (req, res){
    const superSet = req.query.superSet
    res.render('authViews/signup-login', {page: "otpAuth", associate: "admin", superSet})
}

exports.get_otp = async function (req, res){
    const {adminDetails} = req
    try{
        const{ id, response} = await setOtpHelper(adminDetails);
        response
        .then( d => {
            const jwtToken = createToken(adminDetails.userDetails, twoPFiveSeconds, awaitingOtpStatus, id);
            res.cookie('aDAO', jwtToken, { maxAge: twoPFiveSeconds * 1000 ,  httpOnly: true});                
            res.send({isSuccess: true})
        })
    }
    catch(error){
        res.send({isSuccess: false, errorMessage: error.message})
    }

}

async function setOtpHelper(adminDetails){
    const {id, otp} = await createOtpDocument(adminDetails.userDetails.email, "admin")
    const message = `${otp} is the One Time Password(OTP) for registration. OTP is valid for next 2 minutes and 30 seconds. Plese do not share with anyone`;
    return {id, response: sendResponseMail(message, otp, adminDetails.userDetails.email, adminDetails.userDetails.name)}
}

exports.post_verifyOtp = async function(req, res){
    const {otp} = req.body;
    try{
        const result = req.adminDetails;
        console.log("post_verifcation", result)
        const otpDoc = await otpModel.findDoc(result.id, otp)
        const jwtToken = createToken(result.userDetails, threeDaysSeconds, loggedStats)
        res.cookie('aDAO', jwtToken, {maxAge: threeDaysSeconds * 1000, httpOnly: true})
        res.send({isSuccess: true})
    }
    catch(error){
        res.send({isSuccess: false, errorMessage: error.message})
    }

}


// USER RELATED CONTROLLERS
exports.get_users = async function(req, res){
    try {
        const pageNumber = req.query.pno
        const {users, totalUserCount} = await userModels.getAllUsers(pageNumber);
        if(users){
            res.send({isSuccess: 1, data: users, totalCount: totalUserCount})
        }
        else
        throw new Error("Something went wrong")
    } catch (error) {
        res.send({isSuccess: false, errorMessage: error.message})
    }
}

exports.get_complete_userDetails = async function(req, res, next){
    try {
        const id = req.params.id;
        const user = await userModels.complete_userDetails(id);
        res.send({isSuccess: true, user});
    } catch (error) {
        next(error)
    }
}

exports.patch_blockUser = async function(req, res){
    
    try {
        if(!req.body.userId) throw new Error("Please provide necessary information: ID")
        const status = await userModels.blockUser(req.body.userId);
        if(status){
            res.send({isSuccess: true, ...status})
        }
        else{
            throw new Error("Something went wrong, operation abandoned.")
        }
    } catch (error) {
        res.send({isSuccess: false, errorMessage: error.message})
    }
}
exports.get_user_serach_result = async function(req, res, next){
    try {
        const searchKey = req.query.searchKey;
        const page = req.query.pno;
        console.log(req.query)
        if(!searchKey) throw new Error("Please provide necessary informations")
        const {user, totalCount} = await userModels.get_search_result(searchKey, page)
        console.log(user.length)
        res.send({isSuccess: true,data: user, totalCount});
    } catch (error) {
        next(error)
    }
}


// CATEGORY RELATED CONTROLLERS
exports.get_categories = async function(req, res){
    try {
        const pageNumber = req.query.pno
        const {categories, totalCount} = await categoryModel.get_categories(pageNumber);
        res.send({isSuccess: true, data: [...categories], totalCount})
    } catch (error) {
        res.send({isSuccess: false, errorMessage: error.message})
    }
}

exports.get_all_categories = async function(req, res){
    try {
        const categories = await categoryModel.find({}, {category: 1});
        res.send({isSuccess: true, data: categories})
    } catch (error) {
        res.send({isSuccess: false, errorMessage: error.message})
    }
}

exports.post_createCategory = async function(req, res){
    const {category, description, parentCategory} = req.body
    try {
        if(!category || !description) throw new Error("Please provide necessary information")
        const createdCategory = await categoryModel.create({
            category, 
            description, 
            parentCategory
        })
        res.send({isSuccess: true, createdCategory})
    } catch (error) {
        res.send({isSuccess: false, errorMessage: error.message})
    }
}

exports.delete_category = async function(req, res){
    // delete it from it's subcategories
    const {id} = req.body
    try {
        if(!id) throw new Error("Please provide necessary information")
        await categoryModel.delete_category(id);
        res.send({isSuccess: true})
    } catch (error) {
        res.send({isSuccess: false, errorMessage: error.message})
    }
}

exports.patch_updateRequest = async function(req, res){
    const id = req.params.id;
    const fieldsToUpdate = req.body.diff

    try {
        if(!id) throw new Error("Please provide necessary information");
        const category = await categoryModel.update_category(id, fieldsToUpdate);
        res.send({isSuccess: true, category})
    } catch (error) {
        res.send({isSuccess: false, errorMessage: error.message})
    }
}

exports.get_category_serach_result = async function(req, res, next){
    try {
        const searchKey = req.query.searchKey;
        const page = req.query.pno;
        console.log(page)
        console.log(req.query)
        if(!searchKey) throw new Error("Please provide necessary informations")
        const {user, totalCount} = await categoryModel.get_search_result(searchKey, page)
        console.log(user.length)
        res.send({isSuccess: true,data: user, totalCount});
    } catch (error) {
        next(error)
    }
}




// forgot password and reset password
exports.get_forgotPassword = async(req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.render("authViews/signup-login", {page: "forgot-password", associate})
}

exports.post_forgotPassword = async(req, res, next)=>{
    try {
        const {credentail} = req.body;
        const userName = await adminModel.isValidCredentail(credentail.email);
        const newToken = await forgotPasswordTokensModel.create_new_token(credentail.email)
        const link = "http://localhost:3000/admin/reset_password/"+newToken.key
        sendPasswordResetMail(userName, link, credentail.email)
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
        const user = await adminModel.update_password(credentail, newPassword)
        await forgotPasswordTokensModel.expire_token(credentail)
        const jwtToken = createToken(user, threeDaysSeconds, "logged");
        res.cookie('aDAO', jwtToken, { maxAge: 3 * 24 * 60 * 60 * 1000 ,  httpOnly: true});
        res.send({isSuccess: true})
    } catch (error) {
        next(error)
    }
}