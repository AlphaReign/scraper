import utils from './utils';

export class KTable {
	nid = utils.randomID();

	nodes = [];

	constructor (maxsize) {
		this.maxsize = maxsize;
	}

	push (node) {
		if (this.nodes.length >= this.maxsize) {
			return;
		}
		this.nodes.push(node);
	}
}

export default KTable;