exports.up = async (knex) => {
	await knex.schema.createTable('node', (table) => {
		table.string('safeID').primary();
		table.string('id');
		table.string('address');
		table.int('port');
		table.int('lastQueried');
		table.int('created');
		table.int('updated');
	});
	await knex.schema.createTable('torrent', (table) => {
		table.string('infohash').primary();
		table.int('created');
		table.int('updated');
	});
	await knex.schema.createTable('torrentNodeXref', (table) => {
		table.string('safeID');
		table.string('infohash');
	});
};

exports.down = async (knex) => {
	await knex.schema.dropTableIfExists('node');
	await knex.schema.dropTableIfExists('torrent');
	await knex.schema.dropTableIfExists('torrentNodeXref');
};
