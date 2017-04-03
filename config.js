const config = {
	batchSize: 75,
	dht: {
		maxConnections: 4000,
		nodesMaxSize: 2000,
		// Timeout in Milliseconds
		timeout: 5000
	},
	elasticsearch: { host: "127.0.0.1:9200" },
	// Peer Age in Minutes
	peerAge: 30,
	// Scrape Frequency in Seconds
	scrapeFrequency: 1,
	tracker: "udp://tracker.coppersurfer.tk:6969/announce"
};

module.exports = config;