require('dotenv').config();


const express = require('express');
const app = express();
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser');


const userRoutes = require('./routes/userRoutes')
const adminRoutes = require('./routes/adminRoutes')
const utilityRoutes = require('./routes/utilityRoutes')
const cartRoutes = require('./routes/cartRoutes')

const {errorHandler} = require('./Middleware/errorHandler');




app.use(express.json())
app.use(cookieParser())
app.set('view engine', 'ejs')
app.use(express.static('./public'))


app.use('/', userRoutes);
app.use('/', cartRoutes);
app.use('/admin', adminRoutes)
app.use('/utility', utilityRoutes);

app.use(errorHandler)

// TEST STARTING
const testControllers = require('./testController');

app.use('/test', testControllers)

// TEST ENDING


mongoose.connect(process.env.DB_URI)
.then( d => console.log("Database connection established"))
.catch( e => console.log("Couldn't establish database connection: something went wrong"))

app.listen(process.env.PORT_NUMBER , '0.0.0.0', ()=>{
    console.log("Server up on port : " , process.env.PORT_NUMBER)
})