const config = {
	dht: {
		maxConnections: 100000,
		nodesMaxSize: 100000,
		timeout: 5000,
	},
	mongodb: { url: 'mongodb://localhost:27017' },
	redis: {
		host: '127.0.0.1',
		port: 6379,
	},
	sqlite: {
		client: 'sqlite3',
		connection: { filename: "./store/db.sqlite3" },
		useNullAsDefault: true,
	},
	store: 'redis',
};

module.exports = config;