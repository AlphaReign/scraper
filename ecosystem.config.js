module.exports = {
	apps: [
		{
			name: 'crawler',
			script: './src/crawler.js',
		},
		{
			name: 'tracker',
			script: './src/tracker.js',
		},
		{
			name: 'logger',
			script: './src/logger.js',
		},
		{
			name: 'indexer',
			script: './src/indexer.js',
		},
	],
};
