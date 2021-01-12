const bookshelf = require('../databases')
const ReCharge = bookshelf.model('ReCharge', { tableName: 'LichSuNapTien' })

module.exports = ReCharge
