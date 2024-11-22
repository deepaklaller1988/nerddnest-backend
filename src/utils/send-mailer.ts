import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import logger from "./logger";

// const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST,
//     port: 465, // Use 587 for local gmail email ids
//     secure: true, // Use false for local gmail email ids
//     requireTLS: true,
//     // tls: {
//     //     rejectUnauthorized: false
//     //   },
//     auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//     },
//     logger: true
// });

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: 587, // Use 587 for local gmail email ids
    secure: false, // Use false for local gmail email ids
    requireTLS: true,
    // tls: {
    //     rejectUnauthorized: false
    //   },
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    logger: true
});

const sendForgotEmail = (link: any, email: string) => {
    const message = {
        from: process.env.SENDER_EMAIL_ADDRESS,
        to: email,
        subject: 'Reset Password',
        text: `To reset your password, please click the link below.\n\n ${link}`
    };

    //send email
    transporter.sendMail(message, function (err, info) {
        if (err) { 
            console.log(err)
            logger.error(`MAIL ${email} FAILED - SUBJECT: Reset Password ERROR: ${err}`);
         }
        else { 
            console.log('sent');
            logger.info(`MAIL ${email} SUCCEED - SUBJECT: Reset Password`);
         }
    });
}

const sendActivationEmail = (link: any, email: string) => {
    return new Promise((resolve, reject) => {
        const message = {
            from: process.env.SENDER_EMAIL_ADDRESS,
            to: email,
            subject: 'Verify Email',
            text: `Verify your email to activate your account, please click on the link below to activate.\n\n ${link}`
        };
    
        //send email
        transporter.sendMail(message, function (err, info) {
            if (err) { 
                console.log(err);
                logger.error(`MAIL ${email} FAILED - SUBJECT: Verify Email ERROR: ${err}`);
                resolve(false);
            }
            else { 
                console.log('sent'); 
                logger.info(`MAIL ${email} SUCCEED - SUBJECT: Verify Email`);
                resolve(true);
            }
        });
    });
}


const sendOTP = (html: any, email: any, subject: any, from?:any) => {
    return new Promise((resolve, reject) => {
    const message = {
        from: from?from:process.env.SENDER_EMAIL_ADDRESS,
        to: email,
        subject: subject,
        html: html
    };

    //send email
    transporter.sendMail(message, function (err, info) {
        if (err) { 
            console.log(err);
            logger.error(`MAIL ${email} FAILED - SUBJECT: ${subject} ERROR: ${err}`);
            resolve(false);
        }
        else { 
            console.log('sent'); 
            logger.info(`MAIL ${email} SUCCEED - SUBJECT: ${subject}`);
            resolve(true);
        }
    });
});
}


const sendEmail = (html: any, email: any, subject: any, cc?: any, attachment?: any) => {
    return new Promise((resolve, reject) => {
    const message = {
        from: process.env.SENDER_EMAIL_ADDRESS,
        to: email,
        subject: subject,
        html: html,
        cc: cc,
        attachments: attachment
    };

    //send email
    transporter.sendMail(message, function (err, info) {
        if (err) { 
            console.log(err);  
            logger.error(`MAIL ${email} FAILED - SUBJECT: ${subject} ERROR: ${err}`);
            resolve(false);
        }
        else { 
            console.log('sent'); 
            logger.info(`MAIL ${email} SUCCEED - SUBJECT: ${subject}`);
            resolve(true);
        }
    });
});
}

export { sendForgotEmail, sendEmail, sendOTP, sendActivationEmail }