const jwt = require('jsonwebtoken');

exports.parser = async function(req, res, next){
    // console.log(req.cookies.aDAO)
    if(req.cookies.aDAO){
        req.adminDetails = await jwt.verify(req.cookies.aDAO, process.env.JWT_ADMIN_KEY)
    }
    next();
}



exports.isNotLogged = async function(req, res, next){
    if(await admin_is_awaiting_otp(req)){
        return res.redirect('/admin/otp-auth');
    }
    else if(await admin_is_logged_in(req)){
        return res.redirect('/admin/');
    }
    next();
}

exports.isAwaitingOtp = async function(req, res, next){
    if(await admin_is_awaiting_otp(req)){
        return next();
    }
    else if(await admin_is_logged_in(req)){
        return res.redirect("/admin/")
    }
    return res.redirect('/admin/login')
}

exports.isLogged = async function(req, res, next){
    if(await admin_is_logged_in(req)){
        return next();
    }
    else if(await admin_is_awaiting_otp(req)){
        return res.redirect('/admin/otp-auth')
    }
    return res.redirect("/admin/login")
}

async function admin_is_awaiting_otp(req){
    if(req.adminDetails?.status == 'awaiting_otp'){
        return true;
    }
    return false;
}

async function admin_is_logged_in(req){
    if(req.adminDetails?.status == 'logged'){
        console.log("logged")
        return true;
    }
    console.log(req.adminDetails.status)
    return false;
}