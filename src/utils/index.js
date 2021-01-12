
const _ = require('lodash')
const convertTimeToString = (time) => {
  if (time < 60) {
    return {
      hours: 0,
      minute: 0,
      seconds: time,
    }
  }

  const minute = Math.floor(time / 60)
  const rs = { hours: 0, minute: minute % 60, seconds: time % 60 }
  if (minute >= 60) {
    rs.hours = Math.floor(minute / 60)
  }

  return rs
}
const getTypeOfFile = (string) => {
  const rs = string.split('/')
  return rs[0]
}
const genArrayIndexAnswer = (l) => {
  const arr = []
  while (arr.length < l) {
    const r = Math.floor(Math.random() * l)
    if (arr.indexOf(r) === -1) arr.push(r)
  }
  return arr
}
const swapElementInAnswer = (arr) => {
  const indexArray = genArrayIndexAnswer(arr.length)
  const newArr = []
  _.forEach(indexArray, (o) => {
    newArr.push(arr[o])
  })
  return newArr
}
const generateRes = (success, message, data) => { return { success, message, data } }
const generateOptionMail = (mail, subject, description) => {
  const content = `
        <div style="padding: 10px; background-color: #17112C">
            <div style="padding: 15px; background-color: white;">
                <h3 style="color: #22115A">${subject}</h3>
                <span style="color: black">${description}</span>
            </div>
        </div>
    `
  return {
    from: process.env.EMAIL,
    to: mail,
    subject: subject,
    html: content,
  }
}
module.exports = { convertTimeToString, getTypeOfFile, generateRes, swapElementInAnswer, generateOptionMail }
