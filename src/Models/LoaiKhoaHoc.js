const bookshelf = require('../databases')
const LoaiKhoaHoc = bookshelf.model('LoaiKhoaHoc', { tableName: 'LoaiKhoaHoc' })
module.exports = LoaiKhoaHoc
