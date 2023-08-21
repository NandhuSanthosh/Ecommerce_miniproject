const { sendResponseMail } = require("../Middleware/sendMail");
const sendOtp = require("../Middleware/sendOtp");
const otpModel = require("../Models/otpModel");
const userModel = require("../Models/userModels")
const jwt = require("jsonwebtoken")


exports.get_home = async function(req, res){
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.render('./authViews/userHome.ejs')
}

function generateOtp() {
  const min = 100000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createOtpDocument(credentials){
    const otp = generateOtp();
    const alreadyCreated = await otpModel.isAlreadyCreated(credentials);

    if(alreadyCreated){
        if(alreadyCreated.otpAttempts >= 3)
            throw new Error("Too many attempts, Please try again later");
        if(alreadyCreated.used)
            throw new Error("Looks like someone else used your otp, if not you contact with admin")
        alreadyCreated.otpAttempts += 1;
        alreadyCreated.otp = otp;
        alreadyCreated.save();
        return {id: alreadyCreated._id, otp};
    }
    const otpDoc = await otpModel.create({
        otp: otp, 
        credentials
    })
    return {id: otpDoc._id, otp}
}

const maxAge = 2.5 * 60 // seconds
function createToken(userDetails, status, id){
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
    res.render("authViews/signup-login", {page: "login"})
}

exports.post_login = async(req, res)=> {
    const {credentials, password} = req.body;
    try {
        if( (!credentials.email && !credentials.mobile) || !password){
            throw new Error("Please provide necessary informations.")
        }
        const result = await userModel.login(credentials, password);
        const jwtToken = createToken(result.user, "loggedIn");
        res.cookie('uDAO', jwtToken, { maxAge:3 * 24 * 60 * 60 * 1000 ,  httpOnly: true});
        res.send({isSuccess: true})
    } catch (error) {
        res.send({isSuccess: false, errorMessage: error.message})
    }
}

exports.get_signup = (req, res)=>{
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.render('authViews/signup-login', {page : "signup"})
}

exports.get_otpAuthPage = async (req, res)=>{
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.render('authViews/signup-login', {page: "otpAuth"})
}

exports.post_signin = async(req, res) => {
    const userDetails = req.body;
    try{
        await userModel.validation(userDetails);
        const jwtToken = createToken(userDetails, "registration");
        res.cookie('uDAO', jwtToken, { maxAge: maxAge * 1000 ,  httpOnly: true});                
        res.send({isSuccess: true, jwtToken})
    }
    catch(error){
        const e = Object.keys(error.errors)
        const errorMessage = error.errors[e[0]].properties.message
        res.send({isSuccess: false, errorMessage})
    }
    
    // res.send("here")
}

exports.get_otp = async(req, res) => {
    try{
        const result = req.userDetails;
        const { id, otp} = await createOtpDocument(result.userDetails.credentials.email ? result.userDetails.credentials.email : result.userDetails.credentials.mobile.number)
        const message = `${otp} is the One Time Password(OTP) for registration. OTP is valid for next 2 minutes and 30 seconds. Plese do not share with anyone`;
        if(result.userDetails.credentials.email){
            sendResponseMail(message, otp, result.userDetails.credentials.email, result.userDetails.name)
            .then( d => {
                const jwtToken = createToken(result.userDetails, "registration", id);
                res.cookie('uDAO', jwtToken, { maxAge: maxAge * 1000 ,  httpOnly: true});                
                res.send({isSuccess: true})
            })
        }else{
            sendOtp(message)
            .then( d => {
                const jwtToken = createToken(result.userDetails, "registration", id);
                res.cookie('uDAO', jwtToken, { maxAge: maxAge * 1000 ,  httpOnly: true});                
                res.send({isSuccess: true, jwtToken})
            })
            .catch( e=> {
                throw e
            })
        }
    }
    catch (error) {
        res.send({isSuccess: false, errorMessage: error.message})
    }
}

exports.post_verifyOtp = async(req, res) => {
    // find the doucment using user cookie
    const {otp} = req.body;
    try {
        const result = req.userDetails;
        const otpDoc = await otpModel.findDoc(result.id, otp);
        const isAlreadyUsed = await userModel.isAlreadyUsed(result.userDetails);
        await userModel.create(result.userDetails)
        const jwtToken = createToken(result.userDetails, "loggedIn");
        res.cookie('uDAO', jwtToken, { maxAge: 3 * 24 * 60 * 60 * 1000 ,  httpOnly: true});
        res.send({isSuccess: true})
    } catch (error) {
        res.send({isSuccess: false, errorMessage: error.message})
    }
}

