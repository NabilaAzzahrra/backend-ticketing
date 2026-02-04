const express = require('express')
const router = express.Router()
const auth = require('../controller/auth')
const apiKey = require('../middleware/apiKey')
const authJwt = require('../middleware/authJwt')

router.post('/register', auth.register)
router.post('/login', apiKey, auth.login)
router.post('/refresh-token', apiKey, auth.refreshToken)
router.post('/logout', apiKey, auth.logout)

// contoh protected route
router.get('/me', apiKey, authJwt, (req, res) => {
  res.json({
    message: 'Token valid',
    user: req.user
  })
})

module.exports = router
