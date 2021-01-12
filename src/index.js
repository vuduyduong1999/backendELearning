const express = require('express')
const fileUpload = require('express-fileupload')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
// midleware
app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.json())
app.use(fileUpload())

// import routes
const authRoute = require('./Routes/auth')
const rechargeRoute = require('./Routes/recharge')
const uploadRoute = require('./Routes/upload')
const loaiKhoaHocRoute = require('./Routes/loaiKhoaHoc')
const khoaHocRoute = require('./Routes/khoaHoc')
const baiGiangRoute = require('./Routes/baiGiang')
const gioHangRoute = require('./Routes/gioHang')
const thanhToanRoute = require('./Routes/thanhToan')
const tdhtRoute = require('./Routes/tienDoHoanThanh')
const cauhoiRoute = require('./Routes/cauHoi')
const sendmailRoute = require('./Routes/sendmail')
const { generateRes } = require('./utils')
// route
app.use('/api/auth', authRoute)
app.use('/api/recharge', rechargeRoute)
app.use('/api/upload', uploadRoute)
app.use('/api/loaikhoahoc', loaiKhoaHocRoute)
app.use('/api/khoahoc', khoaHocRoute)
app.use('/api/baigiang', baiGiangRoute)
app.use('/api/giohang', gioHangRoute)
app.use('/api/thanhtoan', thanhToanRoute)
app.use('/api/tdht', tdhtRoute)
app.use('/api/cauhoi', cauhoiRoute)
app.use('/api/sendmail', sendmailRoute)

// HOME
app.get('/', async (req, res) => {
  res.status(200).json(generateRes(true, 'Đây là server e-learning được xây dựng và phát triển bởi Vũ Duy Dương và Nguyễn Ngọc Long'))
  // res.sendFile(__dirname + '/home.html')
})
// TEST ZONEEEEEE
// ------------------------

// })
app.all('*', (req, res) => {
  res.status(404).json({ success: false, message: 'Page not found...check your url api' })
})

module.exports = app
