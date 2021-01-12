const router = require('express').Router()
const _ = require('lodash')
const Recharge = require('../Models/Recharge')
const User = require('../Models/User')
const verifytoken = require('./verifyToken')
const Joi = require('joi')
const schemaHistory = Joi.object({
  token: Joi.string().required(),
})
const schemaRecharge = Joi.object({
  token: Joi.string().required(),
  value: Joi.number().min(10).required(),
})
// GET HISTORY RECHARGE
router.post('/', verifytoken, async (req, res) => {
  try {
    const { error } = schemaHistory.validate(req.body)
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message })
    }
    const { id } = req.user
    const user = await new User({ id }).fetch({ require: false })
    if (!user) {
      return res.status(400).json({ success: false, message: "User can't found...." })
    }
    await new Recharge({ maUser: id }).fetchAll({ require: false }).then((rs) => {
      const arrayHistory = _.map(rs.models, (o) => o.attributes)
      res.status(200).json({ success: true, message: 'Successfully....', data: arrayHistory })
    })
    await user.refresh()
  } catch (error) {
    console.log('error', error)
    res.status(400).json({ success: false, message: error })
  }
})

router.post('/charge', verifytoken, async (req, res) => {
  try {
    const { error } = schemaRecharge.validate(req.body)
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message })
    }
    const { value } = req.body
    const { id } = req.user
    const user = await new User({ id }).fetch({ require: false })
    if (!user) {
      return res.status(400).json({ success: false, message: "User can't found...." })
    }
    await new Recharge({ soTien: value, maUser: id }).save()
    await user.refresh()
    res.status(200).json({ success: true, message: 'Successfully....', data: { ...user.attributes } })
  } catch (error) {
    console.log('error', error)
    res.status(400).json({ success: false, message: error })
  }
})
module.exports = router
