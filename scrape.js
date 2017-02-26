var Client = require('bittorrent-tracker');
var elasticsearch = require('elasticsearch');
var es = new elasticsearch.Client({host: '127.0.0.1:9200'});

var search = function(){
    es.search({
        index: 'torrents',
        type: 'hash',
        body: {
            query: {
                match_all: {}
            },
            sort: {
                peers_updated: {
                    order: 'asc',
                    missing: '_first'
                }
            }
        },
        size: 75
    }).then( function (body) {
        if(body.hits.hits.length == 0){
            setTimeout(function(){
                console.log('================================================');
                console.log('Did not find any torrents that do not have peers');
                console.log('================================================');
                search();
            }, 5000);
        }
        hashes = body.hits.hits.map(function(value){ return value._id; });
        console.log('got hashes for torrents');
        scrape(hashes);
    }, function (error) {
        console.trace(error.message);
    });
}

var scrape = function(hashes){
    var requiredOpts = {
        infoHash: hashes,
        announce: ['udp://tracker.coppersurfer.tk:6969/announce']
    };
    Client.scrape(requiredOpts, function(error, results){
        if(error){
            console.log(error);
        }else{
            console.log('got peer info for torrents');
            update(results);
        }
    });
}

var update = function(results){
    var records = [];
    for(var infoHash in results){
        var record = results[infoHash];
        var update = {};
        update.update = {};
        update.update._index = 'torrents';
        update.update._type = 'hash';
        update.update._id = record.infoHash;
        update.update._retry_on_conflict = 3;

        var doc = {};
        doc.doc = {
            seeders: record.complete,
            leechers: record.incomplete,
            peers_updated: Math.floor(Date.now() / 1000)
        };
        doc.doc_as_upsert = true;

        records.push(update);
        records.push(doc);

        console.log(infoHash);
    }

    es.bulk({body: records}, function(error, response){
        if(error){
            console.log(error);
        }else{
            console.log('Bulk Peers updated');
            setTimeout(function(){ search(); }, 1000);
        }
    });
}

search();