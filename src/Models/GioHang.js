const bookshelf = require('../databases')
const GioHang = bookshelf.model('GioHang', {
  tableName: 'GioHang',
})
module.exports = GioHang
