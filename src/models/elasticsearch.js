const { object, string } = require('nativemodels/datatypes');
const { enumerable } = require('nativemodels/customtypes');

const schema = {
	action: enumerable(['index', 'delete', 'upsert']).required(),
	doc: object(),
	id: string(),
	index: string().required(),
};

module.exports = schema;
