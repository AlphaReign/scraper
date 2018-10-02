exports.up = async (knex) => {
	await knex.schema.alterTable('torrents', (table) => {
		table.boolean('searchUpdate').default(false);
		table.dateTime('searchUpdated');
	});
};

exports.down = async (knex) => {
	await knex.schema.alterTable('torrents', (table) => {
		table.dropColumn('searchUpdate');
		table.dropColumn('searchUpdated');
	});
};
