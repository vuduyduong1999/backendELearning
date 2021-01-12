const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport({ // config mail server
  service: 'gmail',
  auth: {
    user: process.env.EMAIL, // Tài khoản gmail vừa tạo
    pass: process.env.EMAIL_PASSWORD, // Mật khẩu tài khoản gmail vừa tạo
  },
  tls: {
    // do not fail on invalid certs
    rejectUnauthorized: false,
  },
})
module.exports = transporter
