import fs from 'fs';
import { log } from './../utils';

export const save = (data) => {
	log('saving data');
	fs.writeFileSync('./data.json', JSON.stringify(data, null, `\t`));
};

export const persist = (data) => {
	setInterval(() => save(data), 10000);
};

export default persist;
