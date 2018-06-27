// import fs from 'fs';

const logData = [];

// const persist = () => fs.writeFileSync('./logs.txt', logData.map((record) => record.logMessage).join(`\n`));

export const log = (message, output = true) => {
	const date = new Date();
	const time = `[${`0${date.getHours()}`.slice(-2)}:${`0${date.getMinutes()}`.slice(-2)}:${`0${date.getSeconds()}`.slice(-2)}]`;
	const logMessage = message && message.message ? `${time}: ${message.message}` : `${time}: ${message}`;

	logData.push({
		date,
		error: message && message.message ? message : undefined,
		logMessage,
		message,
	});

	// persist();

	if (output) {
		console.log(logMessage);
		if (message.message) {
			console.log(message);
		}
	}
};

export default log;
