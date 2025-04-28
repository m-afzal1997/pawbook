const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendVerificationEmail(to, pin) {
  await transporter.sendMail({
    from: `"PawBook" <${process.env.SMTP_TO}>`,
    to,
    subject: 'Your PawBook Verification Code',
    text: `Your verification code is: ${pin}`,
    html: `<p>Your verification code is: <b>${pin}</b></p>`,
  });
}

async function sendResetPinEmail(to, pin) {
  await transporter.sendMail({
    from: `"PawBook" <${process.env.SMTP_TO}>`,
    to,
    subject: 'Your PawBook Password Reset Code',
    text: `Your password reset code is: ${pin}`,
    html: `<p>Your password reset code is: <b>${pin}</b></p>`,
  });
}

module.exports = { sendVerificationEmail, sendResetPinEmail }; 