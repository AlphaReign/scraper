exports.up = async (knex) => {
	await knex.schema.createTable('torrents', (table) => {
		table.string('infohash').primary();
		table.string('name');
		table.string('files');
		table.string('tags');
		table.string('type');
		table.int('length');
		table.dateTime('created');
		table.dateTime('updated');
	});
};

exports.down = async (knex) => {
	await knex.schema.dropTableIfExists('torrents');
};
