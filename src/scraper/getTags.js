const config = require('./../../config');

module.exports = (names, type) =>
	names.reduce((result, name) => {
		const tags = config.tags
			.filter((tag) => {
				if (tag.type !== type) {
					return false;
				} else if (tag.includes && name.indexOf(tag.includes) > -1) {
					return true;
				} else if (tag.match && name.match(tag.match)) {
					return true;
				}
				return false;
			})
			.map(({ tag }) => tag);

		return result.concat(tags);
	}, []);
