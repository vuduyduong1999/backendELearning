const router = require('express').Router()
const { getVideoDurationInSeconds } = require('get-video-duration')
const { getTypeOfFile } = require('../utils')
const fs = require('fs')
// upload image
router.post('/image', async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ success: false, message: 'No files were uploaded...' })
    }

    const { fileupload } = req.files
    if (!fileupload) {
      return res.status(400).json({ success: false, message: 'Set key upload is imageUpload...Please' })
    }
    if (fileupload.mimetype !== 'application/pdf') {
      return res.status(400).json({ success: false, message: 'File type must is pdf...Please' })
    }
    const filename = fileupload.name.replace(/\s/g, '')

    const path = '/publish/pdf/' + filename
    console.log('===============================================')
    console.log('fileupload', fileupload)
    console.log('===============================================')
    await fileupload.mv(`./public${path}`, (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: err })
      }
    })
    res.status(200).json({ success: true, data: { path: path } })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})
// upload video
router.post('/video', async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({ success: false, message: 'No video were uploaded...' })
    }
    // console.log('reqest: ', req)

    const { videoUpload } = req.files
    if (!videoUpload) {
      return res.status(400).json({ success: false, message: 'Set key upload is videoUpload...Please' })
    }
    const videoName = videoUpload.name
    if (getTypeOfFile(videoUpload.mimetype) !== 'video') {
      return res.status(400).json({ success: false, message: 'File type must is video...Please' })
    }
    const path = '/publish/videos/' + videoName
    await videoUpload.mv(`./public${path}`, (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: err })
      }
    })
    const stream = fs.createReadStream(`./public${path}`)
    getVideoDurationInSeconds(stream).then((duration) => {
      res.status(200).json({ success: true, data: { path: path, timeduration: duration } })
    })
  } catch (error) {
    console.log('error', error)
    res.status(500).json({ success: false, message: error })
  }
})

module.exports = router
