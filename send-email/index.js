var aws = require("aws-sdk");
var nodemailer = require("nodemailer");

var ses = new aws.SES();
var s3 = new aws.S3();

var email = 'jedrzejczak.andrzej89+aws.ses@gmail.com';

exports.handler = function (event, context, callback) {

    var mailOptions = {
        from: email,
        subject: "Dragon ball multiverse - new page",
        html: `<p><a href="${event.link}">Here is new page!</a></p>`,
        to: email,
    };

    var transporter = nodemailer.createTransport({ SES: ses });

    transporter.sendMail(mailOptions, function (err, info) {
        if (err) {
            console.log("Error sending email");
            callback(err);
        } else {
            console.log("Email sent successfully");
            callback();
        }
    });
};