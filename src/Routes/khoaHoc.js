const _ = require('lodash')
const router = require('express').Router()
const knex = require('../databases/knex')
const KhoaHoc = require('../Models/KhoaHoc')
const User = require('../Models/User')
const jwt = require('jsonwebtoken')
const moment = require('moment')
const verifytoken = require('./verifyToken')
const { convertTimeToString, generateRes, generateOptionMail } = require('../utils')
const { transporter } = require('../configs')
// GET COURSE BOUGHT
router.post('/bought', verifytoken, async (req, res) => {
  try {
    const { id } = req.user
    const user = await new User({ id }).fetch({ require: false })
    if (!user) {
      return res.status(400).json({ success: false, message: "User can't found...'" })
    }
    knex.from('TienDoHoanThanh').where({ maUser: id }).groupBy('maKH').count('TienDoHoanThanh.id', { as: 'seen' }).select('maKH').then((tds) => {
      knex.from('HoaDon')
        .where('HoaDon.maUser', id)
        .innerJoin('ChiTietHoaDon', 'HoaDon.id', 'ChiTietHoaDon.maHD')
        .innerJoin('KhoaHoc', 'KhoaHoc.id', 'ChiTietHoaDon.maKH')
        .distinct('KhoaHoc.id', 'KhoaHoc.tenKhoaHoc', 'KhoaHoc.moTa', 'KhoaHoc.tongThoiLuong', 'KhoaHoc.soLuongBaiGiang', 'KhoaHoc.gia')
        .then((rs) => {
          const newData = _.map(rs, (t) => {
            const td = _.find(tds, (o) => o.maKH === t.id)
            t.progress = {
              percent: td ? td.seen / t.soLuongBaiGiang : 0,
              seen: td ? td.seen : -1,
            }
            t.active = true
            t.tongThoiLuong = convertTimeToString(t.tongThoiLuong)
            return t
          })
          knex.from('HoaDon')
            .where({ maUser: id })
            .innerJoin('Users', 'Users.id', 'HoaDon.maUser')
            .innerJoin('ChiTietHoaDon', 'HoaDon.id', 'ChiTietHoaDon.maHD')
            .distinct('maKH', 'thoiGianKetThuc')
            .then((rsv) => {
              const rss = _.sortBy(rsv, o => o.thoiGianKetThuc)
              const data = _.map(newData, (t) => {
                const han = _.findLast(rss, o => o.maKH === t.id)

                if (han) {
                  const toEnd = moment().isAfter(moment(han.thoiGianKetThuc).subtract(7, 'day'))
                  const warn = !!((moment().isBefore(han.thoiGianKetThuc)) && toEnd)
                  t.expired = !(moment().isBefore(han.thoiGianKetThuc))
                  t.warning = warn
                }
                return t
              })
              res.status(200).json({ success: true, message: 'Create course successfully...', data: data })
            })
        })
    })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})
// GET COURSE UPLOADED NEW 6
router.post('/upload/recent', verifytoken, async (req, res) => {
  try {
    const { id } = req.user
    const user = await new User({ id }).fetch({ require: false })
    if (!user) {
      return res.status(400).json({ success: false, message: "User can't found...'" })
    }
    const type = user.get('ma')
    if (type === 'ST') {
      return res.status(400).json({ success: false, message: 'You can not use funtion....' })
    }
    const conditional = type === 'AD' ? { trangThai: 0 } : { maUser: id }
    knex('KhoaHoc')
      .where(conditional)
      .innerJoin('Users', 'KhoaHoc.maUser', 'Users.id')
      .orderBy('KhoaHoc.id', 'desc')
      .select('KhoaHoc.id', 'KhoaHoc.tenKhoaHoc')
      .limit(6)
      .then((khs) => {
        res.status(200).json({ success: true, data: khs })
      }).catch((err) => {
        console.log('===============================================')
        console.log('err', err)
        console.log('===============================================')
        res.status(200).json({ success: false, message: 'Failinggg...' })
      })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})
// GET COURSE UPLOADED
router.post('/uploaded', verifytoken, async (req, res) => {
  try {
    const { id } = req.user
    const user = await new User({ id }).fetch({ require: false })
    if (!user) {
      return res.status(400).json({ success: false, message: "User can't found...'" })
    }
    if (user.get('ma') === 'ST') {
      return res.status(400).json({ success: false, message: 'You must became teacher to use funtion....' })
    }
    const arr = await new KhoaHoc().where({ maUser: id }).fetchAll({ require: false })
    const data = arr.models
    const newData = _.map(data, (item) => {
      const newItem = item.attributes
      newItem.tongThoiLuong = convertTimeToString(item.get('tongThoiLuong'))
      newItem.active = true
      newItem.expired = false
      newItem.owmer = true
      return newItem
    })
    res.status(200).json({ success: true, data: newData })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})
// CREATE COURSE
router.post('/add', verifytoken, async (req, res) => {
  try {
    const { id } = req.user
    const user = await new User({ id }).fetch({ require: false })
    if (!user) {
      return res.status(400).json({ success: false, message: "User can't found...'" })
    }
    if (user.get('ma') === 'ST') {
      return res.status(400).json({ success: false, message: "User type must teacher to create new course ...'" })
    }
    const { tenKhoaHoc, moTa, gia, thoiHan, maLKH } = req.body
    let fileupload = false
    let filename = ''
    if (req.files !== undefined) {
      fileupload = req.files.fileupload
      filename = fileupload.name.replace(/\s/g, '')
    }
    let mess = ''
    let path = fileupload ? '/publish/videos/' + filename : null
    if (fileupload) {
      if (fileupload.mimetype !== 'application/pdf') {
        return res.status(400).json({ success: false, message: 'File type must is pdf...Please' })
      }
      if (path) {
        await fileupload.mv(`./public${path}`, (err) => {
          if (err) {
            path = null
            mess = 'Can not send pdf to server from client....'
          }
        })
      }
    }
    await new KhoaHoc({ maLKH, maUser: id, tenKhoaHoc, moTa, gia, thoiHan, taiLieu: path }).save()
    // get
    const arr = await new KhoaHoc().where({ maUser: id }).fetchAll({ require: false })
    const data = arr.models
    const newData = _.map(data, (item) => {
      const newItem = item.attributes
      newItem.tongThoiLuong = convertTimeToString(item.get('tongThoiLuong'))
      // newItem.SoluongVideo = await new BaiGiang().where({ maKH: newItem.id }).count()
      return newItem
    })
    res.status(200).json({ success: true, message: 'Create course successfully...' + mess, data: newData })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})

// GET ALL COURSE UNVERIFIED
router.post('/unverify', verifytoken, async (req, res) => {
  try {
    const { maLKH, maUser } = req.body
    const { id } = req.user
    const user = await new User({ id }).fetch({ require: false })
    if (!user) {
      return res.status(400).json({ success: false, message: "User can't found...'" })
    }
    if (user.get('ma') !== 'AD') {
      return res.status(400).json({ success: false, message: "You are not allowed to use this function...'" })
    }
    const conditional = { trangThai: false }
    if (maLKH) {
      conditional.maLKH = maLKH
    }
    if (maUser) {
      conditional.maUser = maUser
    }
    const arr = await new KhoaHoc().where(conditional).fetchAll({ require: false })
    const data = _.map(arr.models, (item) => {
      const newItem = item.attributes
      newItem.tongThoiLuong = convertTimeToString(item.get('tongThoiLuong'))
      return newItem
    })
    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})
// VERIFY COURSE
router.post('/verify/un', verifytoken, async (req, res) => {
  try {
    const { maKH } = req.body
    const { id } = req.user
    const user = await new User({ id }).fetch({ require: false })
    if (!user) {
      return res.status(400).json({ success: false, message: "User can't found...'" })
    }
    if (user.get('ma') !== 'AD') {
      return res.status(400).json({ success: false, message: "You are not allowed to use this function...'" })
    }
    const khoahoc = await new KhoaHoc().where({ id: maKH }).fetch({ require: false })
    await khoahoc.save({ trangThai: false }).then((edited) => {
      console.log('===============================================')
      console.log('edited', edited)
      console.log('===============================================')
      new KhoaHoc().where({ trangThai: true }).fetchAll({ require: false }).then((unverify) => {
        const data = _.map(unverify.models, (item) => {
          const newItem = item.attributes
          newItem.tongThoiLuong = convertTimeToString(item.get('tongThoiLuong'))
          return newItem
        })
        return res.status(200).json({ success: true, data })
      })
    })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})
// VERIFY COURSE
router.post('/verify', verifytoken, async (req, res) => {
  try {
    const { maKH } = req.body
    const { id } = req.user
    const user = await new User({ id }).fetch({ require: false })
    if (!user) {
      return res.status(400).json({ success: false, message: "User can't found...'" })
    }
    if (user.get('ma') !== 'AD') {
      return res.status(400).json({ success: false, message: "You are not allowed to use this function...'" })
    }
    const khoahoc = await new KhoaHoc().where({ id: maKH }).fetch({ require: false })
    await khoahoc.save({ trangThai: true }).then((edited) => {
      console.log('===============================================')
      console.log('edited', edited)
      console.log('===============================================')
      new KhoaHoc().where({ trangThai: false }).fetchAll({ require: false }).then((unverify) => {
        const data = _.map(unverify.models, (item) => {
          const newItem = item.attributes
          newItem.tongThoiLuong = convertTimeToString(item.get('tongThoiLuong'))
          return newItem
        })
        return res.status(200).json({ success: true, data })
      })
    })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})
// GET COURSE VERIRIED
router.post('/all', async (req, res) => {
  try {
    const { token, maLKH, maUser } = req.body
    const conditional = { trangThai: true }
    if (maLKH) {
      conditional.maLKH = maLKH
    }
    if (maUser) {
      conditional.maUser = maUser
    }
    const arr = await new KhoaHoc().where(conditional).fetchAll({ require: false })
    const data = _.map(arr.models, (item) => {
      const newItem = item.attributes
      newItem.tongThoiLuong = convertTimeToString(item.get('tongThoiLuong'))
      newItem.active = false
      newItem.expired = false
      if (newItem.gia === 0) {
        newItem.active = true
        newItem.expired = false
      }
      return newItem
    })
    if (token === null || token === undefined) { res.status(200).json({ success: true, data }) }
    const user = jwt.verify(token, process.env.TOKEN_SECRET)
    knex.from('TienDoHoanThanh').where({ maUser: user.id }).groupBy('maKH').count('maBG', { as: 'seen' }).select('maKH').then((tds) => {
      knex.from('HoaDon')
        .where({ maUser: user.id })
        .innerJoin('Users', 'Users.id', 'HoaDon.maUser')
        .innerJoin('ChiTietHoaDon', 'HoaDon.id', 'ChiTietHoaDon.maHD')
        .distinct('maKH', 'thoiGianKetThuc')
        .then((rs) => {
          const rss = _.sortBy(rs, o => o.thoiGianKetThuc)
          const newData = _.map(data, (t) => {
            const td = _.find(tds, (o) => o.maKH === t.id)
            t.progress = {
              percent: td ? td.seen / t.soLuongBaiGiang : 0,
              seen: td ? td.seen : -1,
            }
            if (t.maUser === user.id) {
              t.owner = true
              t.active = true
              t.expired = false
              return t
            }

            const han = _.findLast(rss, o => o.maKH === t.id)
            if (han) {
              t.active = true
              t.expired = !(moment().isBefore(han.thoiGianKetThuc))
            }
            if (t.gia === 0) {
              t.active = true
              t.expired = false
            }
            return t
          })
          res.status(200).json({ success: true, data: newData })
        })
    })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})
// DELETE COURSE
router.post('/delete', verifytoken, async (req, res) => {
  try {
    const { id } = req.user
    const user = await new User({ id }).fetch({ require: false })
    if (!user) {
      return res.status(400).json({ success: false, message: "User can't found...'" })
    }
    if (user.get('ma') === 'ST') {
      return res.status(400).json({ success: false, message: "You are not allowed to use this function...'" })
    }
    const { maKH } = req.body
    knex('KhoaHoc').innerJoin('Users', 'KhoaHoc.maUser', 'Users.id').where('KhoaHoc.id', maKH).select('Users.mail', 'KhoaHoc.tenKhoaHoc').then((infos) => {
      const info = infos.length !== 0 ? infos[0] : undefined
      knex('BaiGiang').where({ maKH }).then((bgs) => {
        if (bgs.length === 0) {
          knex('KhoaHoc').where({ id: maKH }).del().then((deleted) => {
            console.log('===============================================')
            console.log('deleted course ', deleted)
            console.log('===============================================')
            transporter.sendMail(generateOptionMail(info.mail, 'DELETE COURSE', `${info.tenKhoaHoc} was deleted !!!`), (error, info) => {
              if (error) {
                return res.status(500).json(generateRes(true, 'Delete is success but send mail to you is fail....'))
              }
            })
            return res.status(200).json(generateRes(true, 'Delete success ...', {}))
          }).catch((err) => {
            console.log('===============================================')
            console.log('err', err)
            console.log('===============================================')
            return res.status(500).json(generateRes(false, 'Delete failinggg ...', {}))
          })
        } else {
          knex('BaiGiang').where({ maKH }).del().then((deleted) => {
            console.log('===============================================')
            console.log('deleted lession', deleted)
            console.log('===============================================')
            knex('KhoaHoc').where({ id: maKH }).del().then((deleted) => {
              console.log('===============================================')
              console.log('deleted course ', deleted)
              console.log('===============================================')
              transporter.sendMail(generateOptionMail(info.mail, 'DELETE COURSE', `${info.tenKhoaHoc} was deleted !!!`), (error, info) => {
                if (error) {
                  return res.status(500).json(generateRes(true, 'Delete is success but send mail to you is fail....'))
                }
              })
              return res.status(200).json(generateRes(true, 'Delete success ...', {}))
            }).catch((err) => {
              console.log('===============================================')
              console.log('err', err)
              console.log('===============================================')
              return res.status(500).json(generateRes(false, 'Delete failinggg ...', {}))
            })
          }).catch((err) => {
            console.log('===============================================')
            console.log('err', err)
            console.log('===============================================')
            return res.status(500).json(generateRes(false, 'Delete failinggg ...', {}))
          })
        }
      }).catch((err) => {
        console.log('===============================================')
        console.log('err', err)
        console.log('===============================================')
        return res.status(500).json(generateRes(false, 'Delete failinggg ...', {}))
      })
    })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})

// GET COURSE VERIRIED HIDE CATEGORIES
router.post('/', async (req, res) => {
  try {
    const { token, maLKH, maUser } = req.body
    const conditional = { trangThai: true }
    if (maLKH) {
      conditional.maLKH = maLKH
    }
    if (maUser) {
      conditional.maUser = maUser
    }
    const arr = await new KhoaHoc().where(conditional).fetchAll({ require: false })
    knex('LoaiKhoaHoc').where({ disable: false }).select('id').then((lkhs) => {
      const unHidearr = _.filter(arr.models, (ob) => {
        const idf = _.findIndex(lkhs, (o) => o.id === ob.get('maLKH'))
        return idf !== -1
      },
      )
      const data = _.map(unHidearr, (item) => {
        const newItem = item.attributes
        newItem.tongThoiLuong = convertTimeToString(item.get('tongThoiLuong'))
        newItem.active = false
        newItem.expired = false
        if (newItem.gia === 0) {
          newItem.active = true
          newItem.expired = false
        }
        return newItem
      })

      if (token === null || token === undefined) { res.status(200).json({ success: true, data }) }
      const user = jwt.verify(token, process.env.TOKEN_SECRET)
      knex.from('TienDoHoanThanh').where({ maUser: user.id }).groupBy('maKH').count('maBG', { as: 'seen' }).select('maKH').then((tds) => {
        knex.from('HoaDon')
          .where({ maUser: user.id })
          .innerJoin('Users', 'Users.id', 'HoaDon.maUser')
          .innerJoin('ChiTietHoaDon', 'HoaDon.id', 'ChiTietHoaDon.maHD')
          .distinct('maKH', 'thoiGianKetThuc')
          .then((rs) => {
            const rss = _.sortBy(rs, o => o.thoiGianKetThuc)
            const newData = _.map(data, (t) => {
              const td = _.find(tds, (o) => o.maKH === t.id)
              t.progress = {
                percent: td ? td.seen / t.soLuongBaiGiang : 0,
                seen: td ? td.seen : -1,
              }
              if (t.maUser === user.id) {
                t.owner = true
                t.active = true
                t.expired = false
                return t
              }
              const han = _.findLast(rss, o => o.maKH === t.id)
              if (han) {
                t.active = true
                t.expired = !(moment().isBefore(han.thoiGianKetThuc))
              }
              if (t.gia === 0) {
                t.active = true
                t.expired = false
              }
              return t
            })
            res.status(200).json({ success: true, data: newData })
          })
      })
    })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})
module.exports = router
