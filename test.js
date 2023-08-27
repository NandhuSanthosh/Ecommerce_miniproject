const express = require('express');
const app = express();
const port = 5500;
const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://nandhusanthosh87:wxRauGyVEsOUBEAI@cluster0.ypf0xf0.mongodb.net/?retryWrites=true&w=majority")
.then(()=>{
    console.log("connected")
})

const testSchema = new mongoose.Schema({
    name : {
        type: String
    }, 
    alternative: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'tests'
    }
})

const testModel = mongoose.model("tests", testSchema)


async function createDoc(){
    const testDoc = await testModel.create({
        name: "Electronics", 
        alternative: "64e9bd3abb75f48f7ba8d2b9"
    })
    console.log(testDoc);
}
// createDoc();
async function findDoc(){
    const testDoc = await testModel.findOne({
        name: "Gadgets"
    });
    const output = await testModel.find({
        _id: testDoc.alternative
    })
    console.log(testDoc, output);
}
findDoc();

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server is listening on port ${port}`);
});