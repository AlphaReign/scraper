import { convertBuffers } from './../utils';
import fs from 'fs';

export const load = () => convertBuffers(JSON.parse(fs.readFileSync('./data.json').toString()));

export default load;
