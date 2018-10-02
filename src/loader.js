const config = require('./../config');
const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({ host: `${config.elasticsearch.host}:${config.elasticsearch.port}` });

const getRecords = (knex) =>
	knex('torrents')
		.where({ searchUpdated: false })
		.limit(config.search.limit);

const update = async (knex, records) => {
	const body = records.reduce(
		(result, record) => [
			...result,
			{
				update: {
					_id: record.infohash,
					_index: 'torrents',
					_retry_on_conflict: 3,
					_type: 'hash',
				},
			},
			{
				doc: {
					...record,
					files: JSON.parse(record.files),
					search: record.name.replace(/_/gu, ' ').replace(/ /gu, ' '),
				},
				doc_as_upsert: true,
			},
		],
		[],
	);

	await client.bulk({ body });
	await knex('torrents')
		.update({
			searchUpdate: true,
			searchUpdated: new Date(),
		})
		.whereIn('infohash', records.map(({ infohash }) => infohash));
};

const search = async (knex) => {
	const records = await getRecords(knex);

	if (records.length > 0) {
		try {
			await update(knex, records);
		} catch (error) {
			// Do nothing
		}
	}

	setTimeout(() => search(knex), config.search.frequency * 1000);
};

module.exports = search;
