module.exports = {
	apps: [
		{
			ignore_watch: [
				'node_modules',
				'*.sqlite3',
			],
			name: 'AlphaReign',
			script: 'src/index.js',
			watch: ["src"],
		},
	],
};
