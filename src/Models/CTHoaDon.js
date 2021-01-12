const bookshelf = require('../databases')
const CTHoaDon = bookshelf.model('CTHoaDon', { tableName: 'ChiTietHoaDon' })
module.exports = CTHoaDon
