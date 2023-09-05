const mongoose = require('mongoose')
const bcrypt = require('bcrypt');

const forgotPasswordTokenSchema = new mongoose.Schema({
    credentail: {
        type: String, 
        required: true, 
        unique: true, 
    }, 
    key: {
        type: String, 
        required: true
    },  
    used: {
        type: Boolean, 
        default: false
    },
    keyGeneratedTime: {
        type: Date, 
        default: ()=> Date.now(),
    }, 
    createdAt: {
        type: Date, 
        default: ()=>new Date()
    }
})
forgotPasswordTokenSchema.index({createdAt: 1}, {expireAfterSeconds: 600}) // to delete document after 1 hour


forgotPasswordTokenSchema.statics.create_new_token = async function(credentail){
    const key = generateRandomString(20)
    try {
        const newToken = await this.create({
            credentail , 
            key
        })
        return newToken
    } catch (error) {
        throw new Error("There is active reset password link for this account. Plese check you inbox.")
    }
}

forgotPasswordTokenSchema.statics.validate_key = async function(key){
    const doc = await this.findOne({key});
    if(doc.used) throw new Error("This link is already used to change password")
    if(!doc){
        throw new Error("There is nothing to see here, invalid or expired link.")
    }
    return doc.credentail;
}

forgotPasswordTokenSchema.statics.expire_token = async function(credentail){
    if(!credentail) throw new Error("Please provide necessary information");
    const token = await this.findOneAndUpdate({credentail}, {$set: {used: true}});
}

function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charactersLength);
        result += characters.charAt(randomIndex);
    }

    return result;
}




module.exports = mongoose.model("ForgotPasswordTokens", forgotPasswordTokenSchema);