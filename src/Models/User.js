const bookshelf = require('../databases')

const User = bookshelf.model('User', {
  tableName: 'Users',
  bills() {
    return this.hasMany('HoaDon', 'maUser', 'id')
  },
})

module.exports = User
