const verifyToken = require('./verifyToken')
const Joi = require('joi')
const knex = require('../databases/knex')
const _ = require('lodash')
const User = require('../Models/User')
const { generateRes } = require('../utils')
const schemaDelete = Joi.object({
  token: Joi.string().required(),
  arrayCourse: Joi.array().required(),
})
const router = require('express').Router()
router.post('/history', verifyToken, async (req, res) => {
  try {
    const { id } = req.user
    knex('ChiTietHoaDon').innerJoin('HoaDon', 'ChiTietHoaDon.maHD', 'HoaDon.id')
      .leftJoin('KhoaHoc', 'ChiTietHoaDon.maKH', 'KhoaHoc.id')
      .where('HoaDon.maUser', id)
      .select('ChiTietHoaDon.id', 'KhoaHoc.tenKhoaHoc', 'KhoaHoc.gia', 'KhoaHoc.thoiHan', 'HoaDon.ngayLapHD', 'ChiTietHoaDon.maHD')
      .then((cthds) => {
        console.log('===============================================')
        console.log('cthd', cthds)
        console.log('===============================================')
        knex('HoaDon').where('HoaDon.maUser', id).then((hds) => {
          const data = _.map(hds, (o) => {
            const arrCTHD = _.filter(cthds, (ob) => ob.maHD === o.id)
            if (arrCTHD.length === 0) {
              return
            }
            o.arrayDetails = arrCTHD
            return o
          })
          res.status(500).json(generateRes(true, '', data))
        })
      })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})
// Payment
router.post('/', verifyToken, async (req, res) => {
  try {
    const { error } = schemaDelete.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      })
    }
    const { arrayCourse } = req.body
    if (arrayCourse[0] === undefined) {
      res.status(400).json({ success: false, message: 'No course checked in your cart ....' })
    }
    let sumPriceArr = 0
    _.forEach(arrayCourse, (o) => {
      sumPriceArr = sumPriceArr + o.gia
    })
    const { id } = req.user
    if (arrayCourse[0].gia) {
      const user = await new User({ id }).fetch({ require: false })
      const sodu = user.get('soDu')
      if (sodu < sumPriceArr) {
        return res.status(400).json(generateRes(false, 'Recharge your account to buy something....', {}))
      }
    } else {
      return res.status(400).json(generateRes(false, 'Can not read price in your coures....', {}))
    }
    knex.from('HoaDon').insert({ maUser: id }).then((maHD) => {
      const arrInsert = _.map(arrayCourse, (o) => {
        const t = { maHD }
        t.maKH = o.id
        return t
      })
      knex('ChiTietHoaDon').insert(arrInsert).then((rs) => {
        knex.from('GioHang').where({ maUser: id }).then((gioHang) => {
          const maGH = gioHang[0].id
          if (!maGH) {
            return res.status(400).json({ success: false, message: "Can't get your cart...." })
          }
          const arrdelete = _.map(arrayCourse, (o) => {
            const t = { maGH }
            t.maKH = o.id
            return t
          })
          arrdelete.forEach((o, index) => {
            knex.from('ChiTietGioHang').where(o).del().then((rs) => {
              console.log('===============================================')
              console.log('deleted', rs)
              console.log('===============================================')
              if (index === arrdelete.length - 1) {
                knex.from('ChiTietGioHang')
                  .innerJoin('GioHang', 'ChiTietGioHang.maGH', 'GioHang.id').where('GioHang.maUser', id)
                  .innerJoin('KhoaHoc', 'ChiTietGioHang.maKH', 'KhoaHoc.id')
                  .innerJoin('LoaiKhoaHoc', 'LoaiKhoaHoc.id', 'KhoaHoc.maLKH')
                  .then((ctgh) => {
                    const arr = _.map(ctgh, (o) => {
                      const { maKH, tenKhoaHoc, gia, moTa, tenLoaiKhoaHoc, thoiHan, soLuongDaBan } = o
                      return { id: maKH, tenKhoaHoc, gia, moTa, tenLoaiKhoaHoc, thoiHan, soLuongDaBan }
                    })
                    return res.status(200).json({
                      success: true,
                      message: 'Successfully....',
                      data: {
                        tongTien: ctgh[0].tongTien || 0,
                        arraydetailscart: arr,
                      },
                    })
                  })
              }
            })
          })
        })
      })
    }).catch((err) => {
      console.log('===============================================')
      console.log('err', err)
      console.log('===============================================')
      res.status(400).json({
        success: false,
        message: 'Can not payment your course....',
      })
    })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})

module.exports = router
