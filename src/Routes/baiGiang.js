const _ = require('lodash')
const jwt = require('jsonwebtoken')
const moment = require('moment')
const router = require('express').Router()
const BaiGiang = require('../Models/BaiGiang')
const User = require('../Models/User')
const fs = require('fs')
const Joi = require('joi')
const verifytoken = require('./verifyToken')
const { getVideoDurationInSeconds } = require('get-video-duration')
const { getTypeOfFile, convertTimeToString, generateRes } = require('../utils')
const knex = require('../databases/knex')
const KhoaHoc = require('../Models/KhoaHoc')
const schemaNewSession = Joi.object({
  token: Joi.string().required(),
  maKH: Joi.number().required(),
  tieuDe: Joi.string().required(),
  moTa: Joi.string().required(),
  // videoUpload: Joi.string().required(),
})
const schemaGetSession = Joi.object({
  token: Joi.string(),
  maKH: Joi.number().required(),

})

// ADD SESSION
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
    const { error } = schemaNewSession.validate(req.body)
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message })
    }
    const { maKH, tieuDe, moTa } = req.body
    if (!req.files) {
      return res.status(400).json({ success: false, message: 'No video were uploaded...' })
    }

    const { videoUpload } = req.files
    if (!videoUpload) {
      return res.status(400).json({ success: false, message: 'Set key file upload is videoUpload...Please' })
    }
    if (getTypeOfFile(videoUpload.mimetype) !== 'video') {
      return res.status(400).json({ success: false, message: 'File type must is video...Please' })
    }
    const videoName = `${maKH}_` + videoUpload.name.replace(/\s/g, '')
    const path = '/publish/videos/' + videoName

    const bgexisted = await new BaiGiang({ video: path }).fetch({ require: false })
    if (bgexisted) {
      return res.status(500).json({ success: false, message: 'Name video was existed.....' })
    }

    await videoUpload.mv(`./public${path}`, async (err) => {
      if (err) {
        console.log(err)
        return res.status(500).json({ success: false, message: 'Can not send video to server....FAIL' })
      }
      const stream = fs.createReadStream(`./public${path}`)
      await getVideoDurationInSeconds(stream).then(async (duration) => {
        await new BaiGiang({ maKH, tieuDe, moTa, video: path, thoiLuong: duration }).save()
        const baiGiangs = await new BaiGiang().where({ maKH }).fetchAll({ require: false })
        const newData = _.map(baiGiangs.models, (item) => {
          const rs = item.attributes
          rs.thoiLuong = convertTimeToString(item.get('thoiLuong'))
          return rs
        })
        return res.status(200).json({ success: true, data: { arrayVideo: newData } })
      }).catch((err) => { return res.status(500).json(generateRes(false, err, {})) })
    })
    // /home/oem/Documents/NODEJS/BACKEND_ELEARNING
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error.message })
  }
})
// GET SESSION
router.post('/', async (req, res) => {
  try {
    const { token, maKH } = req.body
    const { error } = schemaGetSession.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      })
    }
    const khoaHoc = await new KhoaHoc().where({ id: maKH }).fetch({ require: false })
    if (!khoaHoc) {
      return res.status(400).json({ success: false, message: 'Course was not existed......' })
    }
    const baiGiangs = await new BaiGiang().where({ maKH }).fetchAll({ require: false })

    const newData = _.map(baiGiangs.models, (item) => {
      const rs = item.attributes
      rs.thoiLuong = convertTimeToString(item.get('thoiLuong'))
      return rs
    }).sort((a, b) => a.id - b.id)

    if (!token) {
      if (khoaHoc.get('gia') === 0) {
        return res.status(200).json({
          success: true,
          data: {
            active: true,
            expired: false,
            arrayVideo: newData,
          },
        })
      }
      return res.status(200).json({
        success: true,
        data: {
          active: false,
          expired: false,
          arrayVideo: newData,
        },
      })
    }
    const user = jwt.verify(token, process.env.TOKEN_SECRET)
    if (khoaHoc.get('maUser') === user.id) {
      return res.status(200).json({
        success: true,
        data: {
          owner: true,
          active: true,
          enableView: newData.length,
          expired: false,
          arrayVideo: newData,
        },
      })
    }
    knex.from('TienDoHoanThanh').where({ maUser: user.id, maKH }).groupBy('maKH').count('maBG', { as: 'seen' }).select('maKH').then((tds) => {
      const indp = tds.length !== 0 ? tds[0].seen - 1 : -1
      const td = tds.length !== 0 ? tds[0].seen / newData.length : 0
      if (khoaHoc.get('gia') === 0) {
        return res.status(200).json({
          success: true,
          data: {
            progress: td,
            indexProgress: indp,
            enableView: indp + 1,
            active: true,
            expired: false,
            arrayVideo: newData,
          },
        })
      }

      knex.from('HoaDon')
        .where({ maUser: user.id })
        .innerJoin('Users', 'Users.id', 'HoaDon.maUser')
        .innerJoin('ChiTietHoaDon', 'HoaDon.id', 'ChiTietHoaDon.maHD')
        .distinct('maKH', 'thoiGianKetThuc')
        .then((rs) => {
          const rss = _.sortBy(rs, o => o.thoiGianKetThuc)
          const han = _.find(rss, (i) => i.maKH === maKH)
          if (han) {
            const ex = !moment().isBefore(han.thoiGianKetThuc)
            return res.status(200).json({
              success: true,
              data: {
                progress: td,
                indexProgress: indp,
                enableView: indp + 1,
                active: true,
                expired: ex,
                arrayVideo: newData,
              },
            })
          } else {
            console.log('===============================================')
            console.log('td', td)
            console.log('===============================================')
            console.log('===============================================')
            console.log('ind', indp)
            console.log('===============================================')
            return res.status(200).json({
              success: true,
              data: {
                progress: td,
                indexProgress: indp,
                enableView: indp + 1,
                active: false,
                expired: false,
                arrayVideo: newData,
              },
            })
          }
        })
    })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})

module.exports = router
