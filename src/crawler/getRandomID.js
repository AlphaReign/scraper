const crypto = require('crypto');

module.exports = () =>
	crypto
		.createHash('sha1')
		.update(crypto.randomBytes(20))
		.digest();
