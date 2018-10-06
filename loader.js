#! /usr/local/bin/node

require('babel-register')({
	plugins: ['transform-object-rest-spread'],
	presets: [['env', { targets: { node: 'current' } }]],
});

require('./src/loader.js');
