const clean = (data) => {
	if (Buffer.isBuffer(data)) {
		return data.toString();
	} else if (Array.isArray(data)) {
		return data.map(clean);
	} else if (typeof data === 'object') {
		return Object.keys(data).reduce((result, key) => Object.assign(result, { [key]: clean(data[key]) }), {});
	}

	return data;
};

module.exports = clean;
