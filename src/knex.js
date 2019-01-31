const config = require('./../config');
const knex = require('knex')(config.db);

module.exports = knex;
