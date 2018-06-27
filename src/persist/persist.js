import fs from 'fs';

export const save = (data) => {
	fs.writeFileSync('./data.json', JSON.stringify(data, null, `\t`));
};

export const persist = (data) => {
	setInterval(() => save(data), 10000);
};

export default persist;
