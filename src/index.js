const DHT = require('dht-server');
const Loader = require('./loader');
// const Scraper = require('./scraper');
// const Tracker = require('./tracker');

const dht = new DHT();
const loader = new Loader();
// const scraper = new Scraper();
// const tracker = new Tracker();

// const findEmptyTorrents = async () => {
// 	const emptyTorrents = await loader.getEmptyTorrents();

// 	emptyTorrents.forEach((torrent) => dht.findNodes(torrent.infohash));
// };

const onAddTorrent = (message, rinfo, event) => {
	const infoHash = message.a.info_hash.toString('hex');
	// const id = message.a.id.toString('hex');
	// const { address, port } = rinfo;

	// scraper.getMetaData(infoHash, { address, id, port });
	loader.addTorrent(infoHash);
	loader.log('addTorrent', `Added torrent from ${event} event`, 'success');
};

dht.on('listening', (options) => console.log(`DHT listening on ${options.address}:${options.port}`));
dht.on('announcePeerQuery', (message, rinfo) => onAddTorrent(message, rinfo, 'announcePeerQuery'));
dht.on('getPeersQuery', (message, rinfo) => onAddTorrent(message, rinfo, 'getPeersQuery'));

dht.start();

setInterval(() => dht.makeNeighbours(), 5000);
setInterval(() => console.log('total nodes', dht.nodes.length), 15000);

// setInterval(() => findEmptyTorrents(), 1000);
// setInterval(() => tracker.updatePeers(), 1000);
