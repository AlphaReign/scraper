const handleError = require('./handleError');

module.exports = (fn) => (...params) => {
	try {
		const response = fn(...params);

		return response;
	} catch (error) {
		handleError(error);
	}

	return undefined;
};
