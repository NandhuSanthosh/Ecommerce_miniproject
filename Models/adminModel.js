const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const adminSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: ['true', "Provide name"]
    }
    ,email: {
        type: String, 
        required: ['true', "Provide email"], 
        unique: [true, "Email alreay associated with another account"]
    }, 
    password: {
        type: String, 
        required: ['true', "Provide password"]
    }
})

adminSchema.statics.insertAdmin = async function(name, email, pass){
    try {
        const hashedPass = await bcrypt.hash(pass, 10);
        const user = await this.create({
            name, 
            email, 
            password: hashedPass
        })
    } catch (error) {
        throw error
    }

}

adminSchema.statics.login = async function(credentials, password){
    try {
        const user = await this.findOne({email: credentials.email});
        if(user){
            const result = await bcrypt.compare(password, user.password);
            if(result) return user;
        }
        throw new Error("Email or password invalid.")
    } catch (error) {
        throw error
    }    
}

adminSchema.statics.isValidCredentail = async function(email){
    if(!email) throw new Error("Please provide necessary information")
    const admin =  await this.findOne({email});
    if(!admin) throw new Error("The email is not associated with any admin account.")
    return admin.name
}

adminSchema.statics.update_password = async function(email, newPassword){
    if(!email || !newPassword) throw new Error("Please provide all necessary informations.")
    const hashPassword = await bcrypt.hash(newPassword, 10);
    const user = await this.findOneAndUpdate({email}, {$set: {password: hashPassword}}, {new: true})
    if(!user) throw new Error("There is no admin associate with the account.")
    return user;
}


module.exports = mongoose.model("admins", adminSchema)
