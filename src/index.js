const DHT = require('dht-server');
const dht = new DHT();

dht.on('listening', (options) => {
	console.log(`DHT listening on ${options.address}:${options.port}`);
});
dht.on('announcePeerQuery', (message) => {
	console.log(`onAnnouncePeerQuery - new torrent: ${message.a.info_hash.toString('hex')}`);
});
dht.on('getPeersQuery', (message) => {
	console.log(`onGetPeersQuery - new torrent: ${message.a.info_hash.toString('hex')}`);
});

dht.start();

setInterval(() => dht.makeNeighbours(), 5000);
setInterval(() => {
	console.log('total nodes', dht.nodes.length);
}, 15000);
