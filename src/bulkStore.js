/* eslint-disable camelcase */

const del = (index, id) => [{ delete: { _id: id, _index: index, _type: '_doc' } }];

const index = (index, doc, id) => [{ index: { _index: index, _type: '_doc', ...(id ? { _id: id } : {}) } }, doc];

const upsert = (index, doc, id) => [
	{ update: { _index: index, _type: '_doc', ...(id ? { _id: id } : {}) } },
	{ doc, doc_as_upsert: true },
];

const parseRecord = (record) => {
	if (!record) {
		return [];
	}

	if (record.action === 'index') {
		return index(record.index, record.doc, record.id);
	} else if (record.action === 'upsert') {
		if (record.id) {
			return upsert(record.index, record.doc, record.id);
		}
		return index(record.index, record.doc, record.id);
	} else if (record.action === 'delete') {
		return del(record.index, record.id);
	}

	throw new Error(`Action isn't valid`);
};

const buildBody = (records) => records.reduce((result, record) => [...result, ...parseRecord(record)], []);

const bulkStore = async (records, client) => {
	const response = await client.bulk({ body: buildBody(records) });

	if (response.errors) {
		const badRecords = response.items.filter((record) => Boolean(record.error));

		if (badRecords.length > 0) {
			console.log(`Bad Records with ElasticSearch logger. \n\n${JSON.stringify(badRecords, null, 4)}`);
		} else {
			console.log(`Bad Records with ElasticSearch logger. \n\n${JSON.stringify(response, null, 4)}`);
		}
	} else {
		console.log(`Bulk inserted ${records.length} records`);
	}
};

module.exports = bulkStore;
