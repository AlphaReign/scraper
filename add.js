'use strict';
var _ = require('lodash');
var P2PSpider = require('./lib');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({host: '127.0.0.1:9200'});

var p2p = P2PSpider({
	nodesMaxSize: 2000,
	maxConnections: 4000,
	timeout: 5000
});

var records = [];
var creations = [];
var updateES = function(record){
	var update = {};
	update.update = {};
	update.update._index = 'torrents';
	update.update._type = 'hash';
	update.update._id = record.infohash;
	update.update._retry_on_conflict = 3;


	var doc = {};
	doc.doc = record;
	doc.doc_as_upsert = true;

	records.push(update);
	records.push(doc);

	var script = {};
	script.script = {};
	script.script.inline = `if( !ctx._source.containsKey("created") ){ ctx._source.created = params.time; }`;
	script.lang = 'painless';
	script.script.params = {time : Math.floor(Date.now()/1000)};

	creations.push(update);
	creations.push(script);


	if(records.length > 1000){
		var temp = records;
		var temp2 = creations;
		records = [];
		creations = [];

		client.bulk({body: temp}, function(error, response){
			if(error){
				console.log(error);
			}else{
				console.log("Everything good with ES Update");
				client.bulk({body: temp2}, function(error, response){
					if(error){
						console.log(error);
					}else{
						console.log("Creation Times Added");
					}
				})
			}
		});
	}
}

p2p.ignore(function (infohash, rinfo, callback) {
	// false => always to download the metadata even though the metadata is exists.
	var theInfohashIsExistsInDatabase = false;
	callback(theInfohashIsExistsInDatabase);
});

p2p.on('metadata', function (metadata) {
	var record = {};
	if(typeof metadata.info.name !== 'undefined'){
		record.name = metadata.info.name.toString();
		record.search = record.name.replace(/\./g, ' ');
		record.search = record.search.replace(/\_/g, ' ');
		record.infohash = metadata.infohash;
		record.magnet = metadata.magnet;
		record.updated = Math.floor(new Date().getTime() / 1000);
		record.dht = 1;

		if(typeof metadata.info['file-duration'] !== 'undefined' && metadata.info['file-duration'].length < 100){
			record.file_duration = metadata.info['file-duration'];
		}

		if(typeof metadata.info['file-media'] !== 'undefined' && metadata.info['file-media'].length < 100){
			record.file_media = metadata.info['file-media'];
		}

		var files = metadata.info.files;
		if(typeof files !== 'undefined' && files.length < 100){
			record.files = [];
			files.forEach(function(element){
				try{
					var temp = {};
					temp.length = element.length;
					temp.path = element.path.toString();
					record.files.push(temp);
					if(temp.path.indexOf('.wmv') > -1){
						record.inactive = true;
					}
				}catch(error){
					console.log(error);
				}
			});
		}

		record.type = '';
		record.categories = [];
		record.tags = [];
		record.peers_updated = 0;

		updateES(record);
		console.log(`Added: ${record.infohash} | ${record.name}`);
	}

});

p2p.listen(6881, '0.0.0.0');