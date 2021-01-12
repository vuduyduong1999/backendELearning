
require('dotenv').config()
const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport({ // config mail server
  service: 'gmail',
  auth: {
    user: process.env.EMAIL || 'elearningwebLD@gmail.com', // Tài khoản gmail vừa tạo
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
      host: process.env.DB_HOST || 'lfmerukkeiac5y5w.cbetxkdyhwsb.us-east-1.rds.amazonaws.com',
      database: process.env.DB_NAME || 'vqdbzx84yowqck55',
      user: process.env.DB_USERNAME || 'vws4pyx8ihqbww2m',
      password: process.env.DB_PASSWORD || 'u9t5xs4ai5vm21re',
      port: process.env.DB_PORT || 3306,
    },
  },
  app: {
    port: parseInt(process.env.PORT) || 3000,
  },
  transporter,
}
