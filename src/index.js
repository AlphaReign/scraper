import { createID, log } from './utils';
import crawl from './crawl';
import dgram from 'dgram';
import processMessage from './process/message';

const id = createID();
const socket = dgram.createSocket('udp4');
const knex = require('knex')({
	client: 'sqlite3',
	connection: {
		filename: './db.sqlite3',
	},
});

socket.on('error', (error) => log(error));

socket.on('message', (message, rinfo) => processMessage({ id, message, rinfo }, socket, knex));

socket.on('listening', () => {
	const address = socket.address();

	log(`client listening ${address.address}:${address.port}`, true);
	crawl(id, socket, knex);
});

socket.bind(6881);
