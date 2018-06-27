export const compactIP = (address) => Buffer.from(address.split('.').map((value) => parseInt(value)));

export const compactPort = (port) => Buffer.from(parseInt(port).toString(16), 'hex');

export const compact = ({ address, port }) => Buffer.concat([compactIP(address), compactPort(port)]);

export const compactNodes = (nodes) => nodes.map((node) => compact(node));

export default {
	compact,
	compactIP,
	compactNodes,
	compactPort,
};
