
require('dotenv').config()
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
module.exports = {
  db: {
    client: 'mysql',
    connection: {
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306,
    },
  },
  app: {
    port: parseInt(process.env.PORT) || 3000,
  },
  transporter,
}
