const bookshelf = require('../databases')

const TienDoHoanThanh = bookshelf.model('TienDoHoanThanh', {
  tableName: 'TienDoHoanThanh',
})
module.exports = TienDoHoanThanh
