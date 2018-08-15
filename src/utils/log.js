export const log = (message) => {
	const date = new Date();
	const time = `[${`0${date.getHours()}`.slice(-2)}:${`0${date.getMinutes()}`.slice(-2)}:${`0${date.getSeconds()}`.slice(-2)}]`;
	const output = message && message.message ? `${time}: ${message.message}` : `${time}: ${message}`;

	console.log(output);
};

export default { log };
