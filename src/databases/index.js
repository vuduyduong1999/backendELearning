const { db } = require('../configs')
const knex = require('knex')(db)
const bookshelf = require('bookshelf')(knex)
module.exports = bookshelf
