const bookshelf = require('../databases')

const KhoaHoc = bookshelf.model('KhoaHoc', {
  tableName: 'KhoaHoc',
})

module.exports = KhoaHoc
