export const depactAddress = (buf, offset = 0) => [0, 1, 2, 3].map((index) => buf.slice(index + offset, index + offset + 1).readUInt8()).join('.');

export const depactPort = (buf, offset = 0) => buf.slice(4 + offset).readUInt16BE();

export const depact = (buf) => ({
	address: depactAddress(buf),
	port: depactPort(buf),
});

export const depactNodes = (data) => {
	const nodes = [];

	for (let i = 0; i + 26 <= data.length; i += 26) {
		nodes.push({
			address: depactAddress(data, i + 20),
			id: data.slice(i, i + 20),
			port: depactPort(data, i + 20),
		});
	}

	return nodes;
};

export default {
	depact,
	depactAddress,
	depactNodes,
	depactPort,
};
