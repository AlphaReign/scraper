const config = require('./../../config');

module.exports = (names) =>
	names.filter((name) => config.filters.find((filter) => name.toLowerCase().includes(filter.toLowerCase())));
