const jwt = require('jsonwebtoken')

exports.isNotLogged = async function(req, res, next){
    if(await user_is_logged_in(req)){
        return res.redirect('/')
    }
    if(await user_is_registered(req)){
        return res.redirect("/otp-Auth")
    }
    next();
}

exports.isRegestered = async function(req, res, next){

    if(await user_is_registered(req)){
        next();
        return;
    }
    if(await user_is_logged_in(req)){
        return res.redirect('/')
    }
    res.redirect('/login')
}

exports.isLogged = async function(req, res, next){
    if(await user_is_logged_in(req)){
        next();
        return;
    }
    if(await user_is_registered(req)){
        return res.redirect('/otp-Auth')
    }
    res.redirect('/login')

}

async function user_is_logged_in(req){
    let result = {};
    if(req.userDetails){
        result = req.userDetails;
    }
    else{
        if(req.cookies.uDAO){
            try {
                result = await jwt.verify(req.cookies.uDAO, process.env.JWT_KEY);
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

async function user_is_registered(req){
    let result = {};
    if(req.userDetails){
        result = req.userDetails;
    }
    else{
        if(req.cookies.uDAO){
            try {
                result = await jwt.verify(req.cookies.uDAO, process.env.JWT_KEY);
            } catch (error) {
                return false;
            }
        }
    }

    if(result.status == "awaiting-otp"){
        req.userDetails = result;
        return true;        
    }
    return false;
}


