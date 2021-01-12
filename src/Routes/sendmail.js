const router = require('express').Router()
const { knex } = require('../databases')
const Joi = require('joi')
const verifyToken = require('./verifyToken')
const { transporter } = require('../configs')
const { generateOptionMail, generateRes } = require('../utils')
const shemaSendMail = Joi.object({
  token: Joi.string().required(),
  subject: Joi.string().required(),
  description: Joi.string().required(),
})
// upload image
router.post('/', verifyToken, async (req, res) => {
  try {
    const { error } = shemaSendMail.validate(req.body)
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      })
    }
    const { id } = req.user
    const { subject, description } = req.body
    knex('Users').where({ id }).select().then((accs) => {
      if (accs[0].email !== '') {
        transporter.sendMail(generateOptionMail(accs[0].email, subject, description), (error, info) => {
          if (error) {
            res.status(500).json(generateRes(false, 'Send mail to you is fail....'))
          } else {
            res.status(200).json(generateRes(true, 'Send mail is successfully....'))
          }
        })
      } else {
        res.status(500).json(generateRes(false, 'You must add your email to profile to recive notification from us....'))
      }
    })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})
module.exports = router
