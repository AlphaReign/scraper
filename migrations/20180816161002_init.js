exports.up = async (knex) => {
	await knex.schema.createTable('torrents', (table) => {
		table.string('infohash', 40).primary();
		table.string('name');
		table.text('files');
		table.string('tags');
		table.string('type');
		table.integer('length');
		table.dateTime('created');
		table.dateTime('updated');
	});
};

exports.down = async (knex) => {
	await knex.schema.dropTableIfExists('torrents');
};
