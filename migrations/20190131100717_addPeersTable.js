exports.up = async (knex) => {
	await knex.schema.createTable('peers', (table) => {
		table.string('infohash', 40).primary();
		table.string('address');
		table.integer('port');
		table.dateTime('created');
		table.dateTime('updated');
	});
};

exports.down = async (knex) => {
	await knex.schema.dropTableIfExists('peers');
};
