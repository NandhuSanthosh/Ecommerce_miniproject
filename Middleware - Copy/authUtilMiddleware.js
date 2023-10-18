const otpModel = require('../Models/otpModel')

exports.generateOtp = function() {
  const min = 100000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

exports.createOtpDocument = async function (credentials, associate){
    const otp = exports.generateOtp();
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
        credentials, 
        associate
    })
    return {id: otpDoc._id, otp}
}