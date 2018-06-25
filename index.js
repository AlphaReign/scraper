#! /usr/local/bin/node

require('babel-register')({
	plugins: ['transform-es2015-modules-commonjs', 'transform-object-rest-spread'],
	presets: [['env', { targets: { node: 'current' } }]],
});

require('./src/index.js');
