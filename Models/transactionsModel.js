const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    amount:{
        type: Number, 
        required: true
    },
    timestamp: {
        type: Date, 
        default: Date.now
    },
    senderID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users', 
    }, 
    receiverID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Users', 
    },
    category: {
        type: String, 
        enum: ["purchase", "refund", "betweenUsers", "addToWallet"]
    }
})

module.exports = mongoose.model("transactions", transactionSchema);