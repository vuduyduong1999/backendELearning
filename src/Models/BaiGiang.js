const bookshelf = require('../databases')

const BaiGiang = bookshelf.model('BaiGiang', {
  tableName: 'BaiGiang',
})

module.exports = BaiGiang
