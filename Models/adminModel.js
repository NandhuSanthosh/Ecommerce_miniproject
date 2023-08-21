const mongoose = require('mongoose')

const adminSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: ['true', "Provide name"]
    }
    ,email: {
        type: String, 
        required: ['true', "Provide email"]
    }, 
    password: {
        type: String, 
        required: ['true', "Provide password"]
    }
})


module.exports = mongoose.model("admins", adminSchema)
