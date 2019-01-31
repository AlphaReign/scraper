const config = require('./../../config');

module.exports = (names) => {
	const weights = names.reduce(
		(result, name) =>
			Object.keys(config.formats)
				.filter((key) => {
					const ext = name ? name.split('.').pop() : '';

					return config.formats[key].find((format) => format === ext);
				})
				.reduce(
					(weight, type) => Object.assign(weight, { [type]: weight[type] ? weight[type] + 1 : 1 }),
					result,
				),
		{},
	);

	return Object.keys(weights).reduce(
		(result, type) => (result && weights[result] > weights[type] ? result : type),
		'',
	);
};
