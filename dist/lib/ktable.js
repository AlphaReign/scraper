'use strict';

var utils = require('./utils');

var KTable = function KTable(maxsize) {
    this.nid = utils.randomID();
    this.nodes = [];
    this.maxsize = maxsize;
};

KTable.prototype.push = function (node) {
    if (this.nodes.length >= this.maxsize) {
        return;
    }
    this.nodes.push(node);
};

module.exports = KTable;