const _ = require('lodash')
const { knex } = require('../databases')
const router = require('express').Router()
const LoaiKhoaHoc = require('../Models/LoaiKhoaHoc')
const User = require('../Models/User')
const { generateRes } = require('../utils')
const verifytoken = require('./verifyToken')
// ADD NEW CATEGORY
router.post('/add', verifytoken, async (req, res) => {
  try {
    const { id } = req.user
    const user = await new User({ id }).fetch({ require: false })
    if (!user) {
      return res.status(500).json({ success: false, message: "User can't found...'" })
    }
    if (user.get('ma') !== 'AD') {
      return res.status(400).json({ success: false, message: "User can't add new category..." })
    }
    const { tenLoaiKhoaHoc } = req.body
    await new LoaiKhoaHoc({ tenLoaiKhoaHoc }).save()
    const arr = await new LoaiKhoaHoc().fetchAll({ require: false })
    const data = arr.models
    const newData = _.map(data, (item) => item.attributes)
    res.status(200).json({ success: true, message: 'Add category successfully.....', data: newData })
  } catch (err) {
    console.log('err', err)
    res.status(400).json({ success: false, message: err })
  }
})
// UNHIDE CATEGORY
router.post('/unhide', verifytoken, async (req, res) => {
  try {
    const { id } = req.user
    const { maLKH } = req.body
    knex('Users').where({ id }).select().then((user) => {
      if (user[0].ma !== 'AD') {
        res.status(400).json(generateRes(false, 'You can not use this function....'))
      }
      knex('LoaiKhoaHoc').where({ id: maLKH }).update({ disable: false }).then((rs) => {
        console.log('===============================================')
        console.log('updated', rs)
        console.log('===============================================')
        knex('LoaiKhoaHoc').select().then((lkhs) => {
          return res.status(200).json({ success: true, message: 'Hide category successfully.....', lkhs })
        })
      })
    })
  } catch (err) {
    console.log('err', err)
    res.status(400).json({ success: false, message: err })
  }
})
// HIDE CATEGORY
router.post('/hide', verifytoken, async (req, res) => {
  try {
    const { id } = req.user
    const { maLKH } = req.body
    knex('Users').where({ id }).select().then((user) => {
      if (user[0].ma !== 'AD') {
        res.status(400).json(generateRes(false, 'You can not use this function....'))
      }
      knex('LoaiKhoaHoc').where({ id: maLKH }).update({ disable: true }).then((rs) => {
        console.log('===============================================')
        console.log('updated', rs)
        console.log('===============================================')
        knex('LoaiKhoaHoc').select().then((lkhs) => {
          return res.status(200).json({ success: true, message: 'Hide category successfully.....', lkhs })
        })
      })
    })
  } catch (err) {
    console.log('err', err)
    res.status(400).json({ success: false, message: err })
  }
})
// GET ALL CATEGORY
router.post('/all', async (req, res) => {
  try {
    const arrayLKH = await new LoaiKhoaHoc().fetchAll({ require: false })
    const data = arrayLKH.models
    const newArray = _.map(data, (item) => {
      return item.attributes
    })
    res.status(200).json({ success: true, data: newArray })
  } catch (err) {
    console.log('err', err)
    res.status(400).json({ success: false, message: err })
  }
})
// GET CATEGORIES WITHOUT DISABLE
router.post('/', async (req, res) => {
  try {
    const arrayLKH = await new LoaiKhoaHoc().where({ disable: false }).fetchAll({ require: false })
    const data = arrayLKH.models
    const newArray = _.map(data, (item) => {
      return item.attributes
    })
    res.status(200).json({ success: true, data: newArray })
  } catch (err) {
    console.log('err', err)
    res.status(400).json({ success: false, message: err })
  }
})

module.exports = router
