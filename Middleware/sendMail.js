const nodemailer = require("nodemailer");
const MailGen = require('mailgen')

exports.sendResponseMail = function(text, otp, userEmail, name){
    let config = {
        service : 'gmail', 
        auth: {
            user: process.env.EMAIL, 
            pass: process.env.PASSWORD
        }
    }

    const transporter = nodemailer.createTransport(config)

    let MailGenerator = new MailGen({
        theme: "default", 
        product: {
            name: "Mailgen", 
            link: "https://mailgen.js/"
        }
    })

    let response = {
        body: {
            name: name,
            intro: text,
                button: {
                    color: '#33b5e5',
                    text: otp,
            },
            outro: "Thanku for choosing us"
        },
    }

    let mail = MailGenerator.generate(response);

    let message = {
        from: process.env.EMAIL, 
        to: userEmail, 
        subject: "Registration OTP", 
        html: mail
    }

    return transporter.sendMail(message)
}