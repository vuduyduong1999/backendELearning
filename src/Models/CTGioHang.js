const bookshelf = require('../databases')
const CTGioHang = bookshelf.model('CTGioHang', { tableName: 'ChiTietGioHang' })
module.exports = CTGioHang
