module.exports = (data) => {
	const nodes = [];

	for (let i = 0; i + 26 <= data.length; i += 26) {
		nodes.push({
			address: `${data[i + 20]}.${data[i + 21]}.${data[i + 22]}.${data[i + 23]}`,
			nid: data.slice(i, i + 20),
			port: data.readUInt16BE(i + 24),
		});
	}
	return nodes;
};
