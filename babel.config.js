module.exports = (api) => {
	api.cache(false);

	return {
		plugins: ['@babel/plugin-proposal-object-rest-spread'],
		presets: [
			[
				'@babel/preset-env',
				{
					targets: {
						node: '8',
					},
				},
			],
		],
	};
};
