const jwt = require('jsonwebtoken')
const userModels = require('../Models/userModels')

exports.parser = async function(req, res, next){
    if(req.cookies.uDAO){
        const result = await jwt.verify(req.cookies.uDAO, process.env.JWT_KEY)
        req.userDetails = result
    }

    next();
}

exports.isNotLogged = async function(req, res, next){
    const logoutStatus = req.query.bthp;
    if(logoutStatus){
        res.clearCookie('uDAO', { httpOnly: true, expires: new Date(0) });
    }
    else{
        if(await user_is_logged_in(req, next)){
            return res.redirect('/')
        }
        if(await user_is_registered(req, next)){
            return res.redirect("/otp-Auth")
        }
    }
    next();
}

exports.isRegestered = async function(req, res, next){
    console.log("isRegestered")
    if(await user_is_registered(req, next)){
        console.log("here")
        next();
        return;
    }
    if(await user_is_logged_in(req, next)){
        return res.redirect('/')
    }
    res.redirect('/login')
}

exports.isLogged = async function(req, res, next){
    if(await user_is_logged_in(req, next)){
        console.log("here")
        next();
        return;
    }
    if(await user_is_registered(req, next)){
        return res.redirect('/otp-Auth')
    }
    res.redirect('/login')

}

async function user_is_logged_in(req, next){
    let result = {};
    if(req.userDetails){
        result = req.userDetails;
    }
    else{
        if(req.cookies.uDAO){
            try {
                result = await jwt.verify(req.cookies.uDAO, process.env.JWT_KEY);
                if(await isBlocked(result.userDetails._id)){
                    const e =  new Error("User is blocked")
                    next(e)
                }
            } catch (error) {
                return false;
            }
        }
    }
    if(result.status == "loggedIn"){
        req.userDetails = result;
        return true;
    }
    return false;
}

async function user_is_registered(req, next){
    let result = {};
    if(req.userDetails){
        result = req.userDetails;
    }
    else{
        if(req.cookies.uDAO){
            try {
                console.log(req.cookies.uDAO)
                result = await jwt.verify(req.cookies.uDAO, process.env.JWT_KEY);
                console.log(result)
                if(await isBlocked(result.userDetails._id)){
                    const e =  new Error("User is blocked")
                    return next(e)
                }
            } catch (error) {
                console.log(error)
                return false;
            }
        }
    }
    console.log(req.cookies.uDAO)
    console.log("this is the result", result)
    if(result.status == "awaiting-otp"){
        req.userDetails = result;
        return true;        
    }
    return false;
}

async function isBlocked(id){
    const user = await userModels.findById(id, {isBlocked: 1});
    
    console.log("this is user blocked status: ", user)
    return false;
    // return user.isBlocked
}




