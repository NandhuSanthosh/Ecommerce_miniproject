const jwt = require('jsonwebtoken')

const adminModel = require('../Models/adminModel');
const {  createOtpDocument } = require('../Middleware/authUtilMiddleware');
const { sendResponseMail } = require("../Middleware/sendMail");

const otpModel = require('../Models/otpModel');
const userModels = require('../Models/userModels');
const categoryModel = require('../Models/categoryModel')

const awaitingOtpStatus = "awaiting_otp";
const loggedStats = "logged"

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
        const token = createToken(user, threeDaysSeconds, awaitingOtpStatus)
        res.cookie('aDAO', token)
        res.send({isSuccess: true})
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
        const {id, otp} = await createOtpDocument(adminDetails.userDetails.email, "admin")
        const message = `${otp} is the One Time Password(OTP) for registration. OTP is valid for next 2 minutes and 30 seconds. Plese do not share with anyone`;
        sendResponseMail(message, otp, adminDetails.userDetails.email, adminDetails.userDetails.name)
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
        const users = await userModels.getAllUsers();
        if(users){
            res.send({isSuccess: 1, data: users})
        }
        else
        throw new Error("Something went wrong")
    } catch (error) {
        res.send({isSuccess: false, errorMessage: error.message})
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


// CATEGORY RELATED CONTROLLERS
exports.get_categories = async function(req, res){
    try {
        const categories = await categoryModel.get_categories();
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