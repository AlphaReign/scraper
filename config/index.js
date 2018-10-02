const filters = require('./filters');
const formats = require('./formats');
const tags = require('./tags');

const config = {
	bootstrapNodes: [
		{ address: 'router.bittorrent.com', port: 6881 },
		{ address: 'dht.transmissionbt.com', port: 6881 },
	],
	crawler: {
		address: '0.0.0.0',
		port: 6881,
	},
	db: {
		client: 'sqlite3',
		connection: {
			filename: './db.sqlite3',
		},
		useNullAsDefault: true,
	},
	debug: false,
	elasticsearch: {
		host: '127.0.0.1',
		port: 9200,
	},
	filters,
	formats,
	search: {
		// Seconds between every bulk insert
		frequency: 60,
		// Amount of torrents to update in elasticsearch at once
		limit: 1000,
	},
	tags,
	tracker: {
		// Minutes before we should try and update a torrent again
		age: 360,
		// Seconds between every scrape
		frequency: 1,
		host: 'udp://tracker.coppersurfer.tk:6969/announce',
		limit: 75,
	},
};

module.exports = config;
