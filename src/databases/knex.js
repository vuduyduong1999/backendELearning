const { db } = require('../configs')
const knex = require('knex')(db)
module.exports = knex
