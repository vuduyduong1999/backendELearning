const bookshelf = require('../databases')
const HoaDon = bookshelf.model('HoaDon', {
  tableName: 'HoaDon',
  billdetails() {
    return this.hasMany('CTHoaDon', 'maHD', 'id')
  },
})
module.exports = HoaDon
