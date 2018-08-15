import { convertBuffers } from './../utils';
import fs from 'fs';

const defaultData = {
	nodes: {},
	torrents: {},
};

export const load = () => (fs.existsSync('./data.json') ? convertBuffers(JSON.parse(fs.readFileSync('./data.json').toString())) : defaultData);

export default load;
