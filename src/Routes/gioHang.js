const router = require('express').Router()
const _ = require('lodash')
const knex = require('../databases/knex')
// const CTGioHang = require('../Models/CTGioHang')
// const KhoaHoc = require('../Models/KhoaHoc')
const GioHang = require('../Models/GioHang')
const User = require('../Models/User')
const verifytoken = require('./verifyToken')
const Joi = require('joi')
const schemaDelete = Joi.object({
  token: Joi.string().required(),
  arrayCourse: Joi.array().required(),
})
// DELETE COURSE IN YOUR
router.post('/delete', verifytoken, async (req, res) => {
  try {
    const { error } = schemaDelete.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      })
    }
    const { arrayCourse } = req.body
    console.log('===============================================')
    console.log('req', req.body)
    console.log('===============================================')
    if (arrayCourse[0] === undefined) {
      return res.status(400).json({ success: false, message: 'No course checked in your cart ....' })
    }
    const { id } = req.user
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
                const data = _.map(ctgh, (o) => {
                  const { maKH, tenKhoaHoc, gia, moTa, tenLoaiKhoaHoc, thoiHan, soLuongDaBan } = o
                  return { id: maKH, tenKhoaHoc, gia, moTa, tenLoaiKhoaHoc, thoiHan, soLuongDaBan }
                })
                return res.status(200).json({
                  success: true,
                  message: 'Successfully....',
                  data: {
                    tongTien: ctgh[0].tongTien || 0,
                    arraydetailscart: data,
                  },
                })
              })
          }
        })
      })
    })
  } catch (err) {
    console.log(err)
    res.status(400).json({ success: false, message: err.message })
  }
})
// ADD COURSE TO CART
router.post('/add', verifytoken, async (req, res) => {
  try {
    const { id } = req.user
    const { maKH } = req.body

    await knex.from('KhoaHoc').where({ id: maKH }).then((khh) => {
      if (!khh[0]) {
        return res.status(400).json({ success: false, message: 'Course was not found....' })
      }
      knex.from('GioHang').where({ maUser: id }).then((gioHang) => {
        const maGH = gioHang[0].id
        if (!maGH) {
          return res.status(400).json({ success: false, message: "Can't get your cart...." })
        }
        knex.from('ChiTietGioHang').where({ maGH, maKH }).count('id', { as: 'count' }).then((rs) => {
          if (rs[0].count !== 0) {
            return res.status(400).json({ success: false, message: 'Course was existed in your cart....' })
          }
          knex.insert({ maGH, maKH }).into('ChiTietGioHang').then((rs) => {
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
                    tongTien: ctgh[0].tongTien,
                    arraydetailscart: arr,
                  },
                })
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
        message: 'Can not add course to cart....',
      })
    })
  } catch (error) {
    console.log('error', error)
    res.status(400).json({ success: false, message: error })
  }
})
// GET ALL DETAILS YOUR CART
router.post('/', verifytoken, async (req, res) => {
  try {
    const { id } = req.user
    const user = await new User({ id }).fetch({ require: false })
    if (!user) {
      return res.status(400).json({ success: false, message: "User can't found...." })
    }
    const gioHang = await new GioHang({ maUser: id }).fetch({ require: false })
    if (!gioHang) {
      return res.status(400).json({ success: false, message: "Can't get your cart...." })
    }
    knex.from('ChiTietGioHang')
      .innerJoin('GioHang', 'ChiTietGioHang.maGH', 'GioHang.id').where('GioHang.maUser', id)
      .innerJoin('KhoaHoc', 'ChiTietGioHang.maKH', 'KhoaHoc.id')
      .innerJoin('LoaiKhoaHoc', 'LoaiKhoaHoc.id', 'KhoaHoc.maLKH')
      // .select('KhoaHoc.id', 'KhoaHoc.tenKhoaHoc', 'KhoaHoc.gia', 'KhoaHoc.moTa', 'KhoaHoc.tenLoaiKhoaHoc', 'KhoaHoc.thoiHan', 'KhoaHoc.soLuongDaBan')
      .then((ctgh) => {
        const arr = _.map(ctgh, (o) => {
          const { maKH, tenKhoaHoc, gia, moTa, tenLoaiKhoaHoc, thoiHan, soLuongDaBan } = o
          return { id: maKH, tenKhoaHoc, gia, moTa, tenLoaiKhoaHoc, thoiHan, soLuongDaBan }
        })
        res.status(200).json(
          {
            success: true,
            message: 'Successfully....',
            data: {
              tongTien: ctgh[0].tongTien,
              arraydetailscart: arr,
            },
          })
      })
  } catch (error) {
    console.log('error', error)
    res.status(400).json({ success: false, message: error })
  }
})

module.exports = router
