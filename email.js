const nodemailer = require('nodemailer');

function sendEmail(req, res, next) {
    if (req.isAuthenticated()) {
        const userEmail = req.user.email;
        const {origin, destination, fare} = req.body
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'mohamednoornoor10@gmail.com',
                pass: 'fuol gcea kzhw mecj'
            }
        });

        let mailOptions = {
            from: 'mohamednoornoor10@gmail.com',
            to: userEmail,
            subject: 'Urban express booking ticket',
            text: `This is your ticket. Your booking from ${origin} to ${destination} with fare ${fare} was successful.`
        };

        transporter.sendMail(mailOptions, function(error, info){
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });
    }
    next();
}

module.exports = sendEmail;
