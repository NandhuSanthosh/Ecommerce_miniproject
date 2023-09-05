const nodemailer = require("nodemailer");
const MailGen = require('mailgen')

exports.sendPasswordResetMail = function(name, link, userEmail){
    let config = {
        service : 'gmail', 
        auth: {
            user: process.env.EMAIL, 
            pass: process.env.PASSWORD
        }
    }

    const transporter = nodemailer.createTransport(config)
    var email = {
        body: {
            name: name,
            intro: "We received a request to reset you account password.To reset your password, please click the button below:",
            action: {
                instructions: 'Click this button to reset password:',
                button: {
                    color: '#22BC66', // Optional action button color
                    text: 'Reset Password',
                    link: link
                }
            },
            outro: "This link is valid for 10 minutes to ensure your account's security. Change you password within the time limit"
        }
    };
    let MailGenerator = new MailGen({
        theme: "default", 
        product: {
            name: "Mailgen", 
            link: "https://mailgen.js/"
        }
    })


    let mail = MailGenerator.generate(email);

    let message = {
        from: process.env.EMAIL, 
        to: userEmail, 
        subject: "Reset Password", 
        html: mail
    }

    return transporter.sendMail(message)
}
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