import fs from 'fs';

export const save = (data) => {
	fs.writeFileSync('./data.json', JSON.stringify(data, null, `\t`));
	fs.writeFileSync('./data.bin', Buffer.from(JSON.stringify(data)), 'binary');
};

export const persist = (data) => {
	setInterval(() => save(data), 10000);
};

export default persist;
