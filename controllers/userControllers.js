const { generateOtp, createOtpDocument } = require("../Middleware/authUtilMiddleware");
const { sendResponseMail } = require("../Middleware/sendMail");
const sendOtp = require("../Middleware/sendOtp");
const otpModel = require("../Models/otpModel");
const userModel = require("../Models/userModels")
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

// verified
exports.get_login = (req, res)=>{
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.render("authViews/signup-login", {page: "login", associate})
}

// 
exports.get_signup = (req, res)=>{
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.render('authViews/signup-login', {page : "signup", associate, superSet: "signup"})
}


// verified
exports.post_login = async(req, res)=> {
    const {credentials, password} = req.body;
    try {
        if( (!credentials.email && !credentials.mobile) || !password){
            throw new Error("Please provide necessary informations.")
        }
        const result = await userModel.login(credentials, password);
        const jwtToken = createToken(result, twoPFiveSeconds, "awaiting-otp");
        res.cookie('uDAO', jwtToken, { maxAge: twoPFiveSeconds * 1000 ,  httpOnly: true});
        res.send({isSuccess: true})
    } catch (error) {
        res.send({isSuccess: false, errorMessage: error.message})
    }
}

// verified
exports.get_otpAuthPage = async (req, res)=>{
    const superSet = req.query.superSet
    console.log(superSet)
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.render('authViews/signup-login', {page: "otpAuth", associate, superSet})
}

// verified
exports.post_signin = async(req, res, next) => {
    const userDetails = req.body;
    try{
        const user = await userModel.create(userDetails);
        console.log(user)

        const jwtToken = createToken(user, twoPFiveSeconds, "awaiting-otp");
        res.cookie('uDAO', jwtToken, { maxAge: twoPFiveSeconds * 1000 ,  httpOnly: true});                
        res.send({isSuccess: true, jwtToken})
    }
    catch(error){
        next(error);
    }
    
    // res.send("here")
}

exports.get_otp = async(req, res) => {
    try{
        const result = req.userDetails;
        const { id, otp} = await createOtpDocument(result.userDetails.credentials.email ? result.userDetails.credentials.email : result.userDetails.credentials.mobile.number, "user")
        const message = `${otp} is the One Time Password(OTP) for registration. OTP is valid for next 2 minutes and 30 seconds. Plese do not share with anyone`;
        if(result.userDetails.credentials.email){
            sendResponseMail(message, otp, result.userDetails.credentials.email, result.userDetails.name)
            .then( d => {
                const jwtToken = createToken(result.userDetails, twoPFiveSeconds, "awaiting-otp", id);
                res.cookie('uDAO', jwtToken, { maxAge: twoPFiveSeconds * 1000 ,  httpOnly: true});                
                res.send({isSuccess: true})
            })
        }else{
            sendOtp(message)
            .then( d => {
                const jwtToken = createToken(result.userDetails, twoPFiveSeconds, "awaiting-otp", id);
                res.cookie('uDAO', jwtToken, { maxAge: twoPFiveSeconds * 1000 ,  httpOnly: true});                
                res.send({isSuccess: true, jwtToken})
            })
            .catch( e=> {
                throw e
            })
        }
    }
    catch (error) {
        console.log(error.message);
        res.send({isSuccess: false, errorMessage: error.message})
    }
}

// exports.post_loginVerifyOtp = async(req, res)=>{
//     const {otp} = req.body
//     console.log("the fuck ")
//      try {
//         const result = req.userDetails;
//         const otpDoc = await otpModel.findDoc(result.id, otp);
//         const jwtToken = createToken(result.userDetails, threeDaysSeconds, "loggedIn");
//         res.cookie('uDAO', jwtToken, { maxAge: 3 * 24 * 60 * 60 * 1000 ,  httpOnly: true});
//         res.send({isSuccess: true})
//     } catch (error) {
//         res.send({isSuccess: false, errorMessage: error.message})
//     }
// }


exports.post_verifyOtp = async(req, res) => {
    // find the doucment using user cookie

    const {otp} = req.body;
    console.log("super set: " ,req.query.superSet);
    try {
        const result = req.userDetails;
        const otpDoc = await otpModel.findDoc(result.id, otp);

        console.log("form otp verification : " ,result)
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


