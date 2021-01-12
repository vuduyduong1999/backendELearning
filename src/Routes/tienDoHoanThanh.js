const verifyToken = require('./verifyToken')
const Joi = require('joi')
const Tdht = require('../Models/TienDoHoanThanh')
const knex = require('../databases/knex')
const _ = require('lodash')
const { generateRes } = require('../utils')

const schemaTDHT = Joi.object({
  token: Joi.string().required(),
  maKH: Joi.number().required(),
  maBG: Joi.number().required(),
})
const schemaRecent = Joi.object({
  token: Joi.string().required(),
})
const router = require('express').Router()
// GET 6 COURSE RECENT
router.post('/', verifyToken, async (req, res) => {
  try {
    const { error } = schemaRecent.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      })
    }
    const { id: maUser } = req.user
    knex('TienDoHoanThanh').where('TienDoHoanThanh.maUser', maUser)
      .innerJoin('KhoaHoc', 'TienDoHoanThanh.maKH', 'KhoaHoc.id')
      .orderBy('TienDoHoanThanh.thoiDiem', 'desc')
      .distinct('KhoaHoc.id', 'KhoaHoc.tenKhoaHoc', 'KhoaHoc.moTa')
      .then((rs) => {
        return res.status(200).json({ success: true, data: rs })
      }).catch((err) => {
        res.status(200).json({ success: true, message: err })
      })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})
// UPDATE TIEN DO
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { error } = schemaTDHT.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      })
    }
    const { id: maUser } = req.user
    const { maBG, maKH } = req.body
    knex('TienDoHoanThanh').where({ maUser, maBG, maKH }).count('id', { as: 'has' }).then((count) => {
      if (count[0].has === 0) {
        knex('TienDoHoanThanh').insert({ maUser, maBG, maKH }).then((rs) => {
          return res.json(generateRes(true, 'You can learn new lesson....', { id: rs }))
        })
      } else {
        res.json(generateRes(true, 'You can learn new lesson....', count[0]))
      }
    }).catch((err) => {
      return res.json(generateRes(false, 'You can not update progress....', err))
    })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})

module.exports = router
