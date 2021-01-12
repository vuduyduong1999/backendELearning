const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
  const token = req.body.token
  console.log('===============================================')
  console.log('token', token)
  console.log('===============================================')
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied',
    })
  }
  try {
    const verified = jwt.verify(token, process.env.TOKEN_SECRET)
    req.user = verified
    next()
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid Token',
    })
  }
}
module.exports = auth
