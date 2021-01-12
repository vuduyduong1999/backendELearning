const router = require('express').Router()
const Joi = require('joi')
const _ = require('lodash')
const knex = require('../databases/knex')
const BaiGiang = require('../Models/BaiGiang')
const User = require('../Models/User')
const verifyToken = require('../Routes/verifyToken')
const { generateRes, swapElementInAnswer } = require('../utils')
const schemaAddQuestion = Joi.object({
  token: Joi.string().required(),
  noiDung: Joi.string().required(),
  maBG: Joi.number().required(),
  arrayAnswer: Joi.array().required(),
})
const schemaDeleteQuestion = Joi.object({
  token: Joi.string().required(),
  maCH: Joi.number().required(),
})
const schemaGetQuestion = Joi.object({
  token: Joi.string().required(),
  maBG: Joi.number().required(),
})
const schemaCheckQuestion = Joi.object({
  token: Joi.string().required(),
  maBG: Joi.number().required(),
  arrayResult: Joi.array().required(),
})
const schemaAnswer = Joi.object({
  id: Joi.number().required(),
  maCH: Joi.number().required(),
})
// CHECK QUESTION
router.post('/check', verifyToken, async (req, res) => {
  try {
    console.log('===============================================')
    console.log('body', req.body)
    console.log('===============================================')
    const { error } = schemaCheckQuestion.validate(req.body)
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message })
    }
    const { id } = req.user
    const user = await new User({ id }).fetch({ require: false })
    if (!user) {
      return res.status(400).json({ success: false, message: "User can't found...'" })
    }
    const { arrayResult, maBG } = req.body

    knex('CauHoi')
      .where({ maBG, chinhXac: 1 })
      .innerJoin('DapAn', 'DapAn.maCH', 'CauHoi.id')
      .select('DapAn.id', 'DapAn.maCH').then((das) => {
        let point = 0
        _.forEach(arrayResult, (o) => {
          const { error } = schemaAnswer.validate(o)
          if (error) {
            return res.status(400).json({ success: false, message: error.details[0].message })
          }
          const verify = _.findIndex(das, (ob) => ob.id === o.id && ob.maCH === o.maCH)
          if (verify !== -1) {
            point++
          }
        })
        const pointexam = (point / das.length) * 100
        return res.status(200).json(generateRes(true, 'Check is SUCCESSFULLY', { point: Math.round(pointexam) }))
      })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})
// GET QUESTION
router.post('/', verifyToken, async (req, res) => {
  try {
    const { error } = schemaGetQuestion.validate(req.body)
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message })
    }
    const { id } = req.user
    const user = await new User({ id }).fetch({ require: false })
    if (!user) {
      return res.status(400).json({ success: false, message: "User can't found...'" })
    }
    const { maBG } = req.body

    knex('CauHoi').innerJoin('DapAn', 'DapAn.maCH', 'CauHoi.id').where({ maBG }).select('DapAn.id', 'DapAn.maCH', 'DapAn.noiDung', 'DapAn.chinhXac').then((das) => {
      const newAnwsers = _.map(das, (o) => {
        const istr = o.chinhXac === 1
        o.chinhXac = istr
        return o
      })
      knex('CauHoi').where({ maBG }).select('id', 'noiDung', 'maBG').then((chs) => {
        const newArr = _.map(chs, (o) => {
          const arrAws = _.filter(newAnwsers, (ob) => ob.maCH === o.id)
          o.arrayAnswer = swapElementInAnswer(arrAws)
          return o
        })
        return res.status(200).json(generateRes(true, 'GET is SUCCESSFULLY', newArr))
      })
    })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})
// DELETE QUESTION
router.post('/delete', verifyToken, async (req, res) => {
  try {
    const { error } = schemaDeleteQuestion.validate(req.body)
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message })
    }
    const { id } = req.user
    const user = await new User({ id }).fetch({ require: false })
    if (!user) {
      return res.status(400).json({ success: false, message: "User can't found...'" })
    }
    if (user.get('ma') === 'ST') {
      return res.status(400).json({ success: false, message: "User type must teacher to create new course ...'" })
    }
    const { maCH } = req.body
    const bg = await new BaiGiang({ id: maCH }).fetch({ require: false })
    if (!bg) {
      return res.status(400).json(generateRes(false, 'Can not find your lession in server....'), {})
    }
    knex('CauHoi').where({ id: maCH }).del().then((deleted) => {
      console.log('===============================================')
      console.log('delete length', deleted)
      console.log('===============================================')
      res.status(200).json(generateRes(true, 'Delete successfully....'))
    })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})
// ADD QUESTION
router.post('/add', verifyToken, async (req, res) => {
  try {
    const { error } = schemaAddQuestion.validate(req.body)
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message })
    }
    const { id } = req.user
    const user = await new User({ id }).fetch({ require: false })
    if (!user) {
      return res.status(400).json({ success: false, message: "User can't found...'" })
    }
    if (user.get('ma') === 'ST') {
      return res.status(400).json({ success: false, message: "User type must teacher to create new course ...'" })
    }
    const { noiDung, maBG, arrayAnswer } = req.body
    const bg = await new BaiGiang({ id: maBG }).fetch({ require: false })
    if (!bg) {
      return res.status(400).json(generateRes(false, 'Can not find your lession in server....'), {})
    }
    knex('CauHoi').insert({ noiDung, maBG }).then((idCH) => {
      const newAws = _.map(arrayAnswer, (o) => {
        o.maCH = idCH[0]
        return o
      })
      knex('DapAn').insert(newAws).then((ids) => {
        if (ids[0] !== 0) { return res.status(200).json(generateRes(true, 'Add question and anwser is SUCCESSFULLY', {})) }
      }).catch((err) => { return res.status(200).json(generateRes(false, err, {})) })
    })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})

module.exports = router
