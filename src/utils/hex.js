export const toHex = (string) => Buffer.from(string).toString('hex');

export const fromHex = (hex) => Buffer.from(hex, 'hex');

export default {
	fromHex,
	toHex,
};
