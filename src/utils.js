import bencode from 'bencode';
import crypto from 'crypto';
import log from 'fancy-log';

export const errorLogger = (error) => (error ? log(error) : undefined);

export const createID = () => crypto.randomBytes(10).toString('hex');

export const createTransactionID = () => crypto.randomBytes(2).toString('hex');

export const encode = (payload) => bencode.encode(payload).toString();

export const toHex = (string) => Buffer.from(string).toString('hex');

export const fromHex = (hex) => Buffer.from(hex, 'hex');

export const compactIP = (ip) => Buffer.from(ip.split('.').map((value) => parseInt(value)));

export const compactPort = (port) => Buffer.from(parseInt(port).toString(16), 'hex');

export const compact = ({ ip, port }) => Buffer.concat([compactIP(ip), compactPort(port)]);

export const depactIP = (buf, offset = 0) => [0, 1, 2, 3].map((index) => buf.slice(index + offset, index + offset + 1).readUInt8()).join('.');

export const depactPort = (buf, offset = 0) => buf.slice(4 + offset).readUInt16BE();

export const depact = (buf) => ({
	ip: depactIP(buf),
	port: depactPort(buf),
});

export const decodeNodes = (data) => {
	const nodes = [];

	for (let i = 0; i + 26 <= data.length; i += 26) {
		nodes.push({
			address: depactIP(data, i + 20),
			id: data.slice(i, i + 20),
			port: depactPort(data, i + 20),
		});
	}

	return nodes;
};

export const clean = (data) => {
	if (typeof data === 'object' && Array.isArray(data)) {
		return data.map((value) => clean(value));
	} else if (Buffer.isBuffer(data)) {
		return data.toString('utf8');
	} else if (typeof data === 'object') {
		return Object.keys(data).reduce(
			(result, key) => ({
				...result,
				[key]: clean(data[key]),
			}),
			{},
		);
	}

	return data;
};

export const cleaner = (torrent) => {
	const cleanTorrent = clean(torrent);

	if (cleanTorrent.info && cleanTorrent.info.pieces) {
		delete cleanTorrent.info.pieces;
	}

	return cleanTorrent;
};

export default {
	clean,
	cleaner,
	compact,
	compactIP,
	compactPort,
	createID,
	createTransactionID,
	decodeNodes,
	depact,
	depactIP,
	depactPort,
	encode,
	errorLogger,
	toHex,
};
