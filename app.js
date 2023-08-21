require('dotenv').config();


const express = require('express');
const app = express();
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser');


const userRoutes = require('./routes/userRoutes')
const utilityRoutes = require('./routes/utilityRoutes')

const testController = require('./controllers/testController.js')

app.use(express.json())
app.use(cookieParser())
app.set('view engine', 'ejs')
app.use(express.static('./public'))


app.use('/', userRoutes);
app.use('/utility', utilityRoutes);


app.get("/test", (req, res)=>{
    res.render('test')
})

mongoose.connect(process.env.DB_URI)
.then( d => console.log("Database connection established"))
.catch( e => console.log("Something went wrong"))

app.listen(process.env.PORT_NUMBER ,()=>{
    console.log("Server up on port : " , process.env.PORT_NUMBER)
})