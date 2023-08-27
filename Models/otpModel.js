const mongoose = require('mongoose');
const bcrypt = require('bcrypt')


const otpSchema = new mongoose.Schema({
    otp: String, 
    used: {
        type: Boolean, 
        default: false
    }, 
    credentials: {
        type: String, 
        unique: true, 
        required: true
    },
    associate: {
        require: true, 
        type: String
    },
    otpAttempts: {
        type: Number, 
        default: 1
    },
    createDate: {
        type: Date, 
        default: ()=> Date.now(),
    },
    expiryDate: {
        type: Date,
        default: function(){
            // after 2minutes 30 seconds
            return new Date(this.createDate.getTime() + 1000 * 60 * 2.5)
        }
    }
})

otpSchema.statics.findDoc = async function(id, otp){

    try{
        if(!id) throw new Error("Something went wrong");
        const otpDoc = await this.findOne({_id: id});
        if(!otpDoc || otpDoc.used){
            throw new Error("OTP not valid");
        }
        else{
            const result = await bcrypt.compare(otp + "", otpDoc.otp);
            if(!result){
                throw new Error("OTP not valid");
            }
        }
        otpDoc.used = true; 
        otpDoc.save();
        return otpDoc;
    }
    catch(error){
        throw error;
    }

}

otpSchema.pre('save', async function(next){
    this.otp = await bcrypt.hash(this.otp, 10);
    next()
})

otpSchema.statics.isAlreadyCreated = async function(credentials){
    if(!credentials){
        throw new Error("Please provide necessary informations");
    }
    const optDoc = await this.findOne({credentials});
    return optDoc;
}

otpSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 10 });

module.exports = mongoose.model('otp', otpSchema);