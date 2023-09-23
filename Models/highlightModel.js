const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema({
    name: {
        type: String, 
        required: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'products',
        required: true
    }], 
    position: {
        type: Number, 
    }
})

const highLightModel = mongoose.model('highlights', highlightSchema);
module.exports = highLightModel


