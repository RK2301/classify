import nodemailer from 'nodemailer'

// export const sendEmail = async (prc: string, email: string, fullName: string) =>
//     new Promise((resolve, reject) => {
//         const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             host: 'smtp.gmail.com',
//             port: 465,
//             secure: true,
//             auth: {
//                 user: process.env.GMAIL_USER,
//                 pass: process.env.GMAIL_PASS
//             }
//         })

//         transporter.sendMail({
//             from: "rami.khattab0@gmail.com",
//             to: email,
//             subject: "Reset Password OTP",
//             html: `
//                     <h3> Dear ${fullName}</h3>
//                     <p>Your verfication code is: ${prc}</p>
//                     <bold>And it will expire in 10 minutes</bold>

//                     `
//         }, (err, info) => {
//             if (err) {
//                 console.error(err);
//                 reject(err)
//             }
//             else {
//                 console.log(info);
//                 resolve(info)
//             }
//         })
//     })

