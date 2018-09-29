var aws = require("aws-sdk");
var nodemailer = require("nodemailer");

var ses = new aws.SES();
var s3 = new aws.S3();

exports.handler = function (event, context, callback) {

    var mailOptions = {
        from: "jedrzejczak.andrzej89+aws.ses@gmail.com",
        subject: "This is an email sent from a Lambda function!",
        html: `<p><b>Test message</b></p>`,
        to: "jedrzejczak.andrzej89@gmail.com",
    };

    // create Nodemailer SES transporter
    var transporter = nodemailer.createTransport({
        SES: ses
    });

    // send email
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