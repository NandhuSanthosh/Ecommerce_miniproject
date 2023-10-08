const mongoose = require("mongoose");

const referalStringSchema = new mongoose.Schema({
    stringArray : {
        type: Array
    }
})

referalStringSchema.statics.get_string = async function(){
    // 35 to 126
    const stringOfUseableCharacters = `!#$%&-0123456789@ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz`
    let stringDoc = await this.findOne();
    const arr = stringDoc.stringArray;

    for(let i = 5; i>=0; i--){
        if(arr[i] <= stringOfUseableCharacters.length - 1){
            arr[i]++;
            break;
        }
        else{
            arr[i] = 0;
        }
    }

    stringDoc = await this.findByIdAndUpdate(stringDoc._id, {$set: {stringArray: arr}});
    console.log(stringDoc)
    let string = "";
    for(let i = 0; i<6; i++){
        string += stringOfUseableCharacters[arr[i]]
    }
    console.log("The referal code is : ", string)
    return string;
}

module.exports = mongoose.model('referalstrings', referalStringSchema);