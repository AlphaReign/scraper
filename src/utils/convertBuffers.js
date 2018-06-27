export const convertBuffers = (data) => {
	if (Array.isArray(data)) {
		return data.map((node) => convertBuffers(node));
	} else if (typeof data === 'object') {
		if (data.type && data.type === 'Buffer') {
			return Buffer.from(data.data);
		}

		return Object.keys(data).reduce(
			(result, key) => ({
				...result,
				[key]: convertBuffers(data[key]),
			}),
			{},
		);
	}

	return data;
};

export default { convertBuffers };
