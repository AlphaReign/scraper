exports.up = async (knex) => {
	await knex.schema.alterTable('torrents', (table) => {
		table.integer('seeders');
		table.integer('leechers');
		table.dateTime('trackerUpdated');
	});
};

exports.down = async (knex) => {
	await knex.schema.alterTable('torrents', (table) => {
		table.dropColumn('seeders');
		table.dropColumn('leechers');
		table.dropColumn('trackerUpdated');
	});
};
