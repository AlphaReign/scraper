const utils = require('./utils');

const KTable = function(maxsize) {
	this.nid = utils.randomID();
	this.nodes = [];
	this.maxsize = maxsize;
};

KTable.prototype.push = function(node) {
	if (this.nodes.length >= this.maxsize) {
		return;
	}
	this.nodes.push(node);
};

module.exports = KTable;
