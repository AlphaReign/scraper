import { createID, log } from './utils';
import persist, { load } from './persist';
import crawl from './crawl';
import dgram from 'dgram';
import processMessage from './process/message';

const id = createID();
const socket = dgram.createSocket('udp4');

const data = {
	nodes: {},
	torrents: {},
};

try {
	const temp = load();

	if (temp.nodes) {
		data.nodes = temp.nodes;
	}
	if (temp.torrents) {
		data.torrents = temp.torrents;
	}
} catch (error) {
	log(error);
}

socket.on('error', (error) => log(error));

socket.on('message', (message, rinfo) => processMessage({ id, message, rinfo }, socket, data));

socket.on('listening', () => {
	const address = socket.address();

	log(`client listening ${address.address}:${address.port}`, true);
	crawl(id, socket, data);
	persist(data);
});

socket.bind(6881);
