var _ = require('lodash');
var elasticsearch = require('elasticsearch');
var es = new elasticsearch.Client({host: '127.0.0.1:9200'});

var videoFormats = ['.3g2', '.3gp', '.amv', '.asf', '.avi', '.drc', '.f4a', '.f4b', '.f4p', '.f4v', '.flv', '.gif', '.gifv', '.m2v', '.m4p', '.m4v', '.mkv', '.mng', '.mov', '.mp2', '.mp4', '.mpe', '.mpeg', '.mpg', '.mpv', '.mxf', '.net', '.nsv', '.ogv', '.qt', '.rm', '.rmvb', '.roq', '.svi', '.vob', '.webm', '.wmv', '.yuv'];
var audioFormats = ['.aa', '.aac', '.aax', '.act', '.aiff', '.amr', '.ape', '.au', '.awb', '.dct', '.dss', '.dvf', '.flac', '.gsm', '.iklax', '.ivs', '.m4a', '.m4b', '.mmf', '.mp3', '.mpc', '.msv', '.ogg', '.opus', '.ra', '.raw', '.sln', '.tta', '.vox', '.wav', '.wma', '.wv'];
var documentFormats = ['.cbr', '.cbz', '.cb7', '.cbt', '.cba', 'djvu', '.epub', '.fb2', '.ibook', '.azw', '.lit', '.prc', '.mobi', '.pdb', '.pdb', '.oxps', '.xps'];
var inactivateFormats = ['.wmv', '.wma', '.z'];

var search = function(){
    es.search({
        index: 'torrents',
        type: 'hash',
        body: {
            query: {
                match_all: {}
            },
            sort: {
                categories_updated: {
                    order: 'asc',
                    missing: '_first'
                }
            }
        },
        size: 2000
    }).then( function (body) {
        if(body.hits.hits.length == 0){
            setTimeout(function(){
                console.log('=====================================================');
                console.log('Did not find any torrents that do not have categories');
                console.log('=====================================================');
                search();
            }, 5000);
        }
        categorize(body.hits.hits);
    }, function (error) {
        console.trace(error.message);
    });
}

var categorize = function(records){
    var results = {};
    for(var i = 0; i < records.length; i++){
        var record = records[i]._source;
        results[record.infohash] = {};
        results[record.infohash].type = '';
        results[record.infohash].categories = [];
        results[record.infohash].tags = [];
        var files = [];
        if(typeof record.files != 'undefined'){
            for(var key in record.files){
                files.push(record.files[key].path);
            }
        }
        files.push(record.name);
        for(var j = 0; j < files.length; j++){
            var file = files[j];
            results[record.infohash] = getType(file, results[record.infohash]);
            results[record.infohash] = getCategories(file, results[record.infohash]);
        }
        results[record.infohash].categories = _.uniq(results[record.infohash].categories);
        results[record.infohash].tags = _.uniq(results[record.infohash].tags);
        delete results[record.infohash].count;
    }
    update(results);
}

var update = function(results){
    var records = [];
    for(var infoHash in results){
        var record = results[infoHash];
        var update = {};
        update.update = {};
        update.update._index = 'torrents';
        update.update._type = 'hash';
        update.update._id = infoHash;
        update.update._retry_on_conflict = 3;

        var doc = {};
        doc.doc = {
            type: record.type,
            categories: record.categories,
            tags: record.tags,
            categories_updated: Math.floor(Date.now() / 1000)
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
            console.log('Bulk Categories Updated');
            setTimeout(function(){ search(); }, 1000);
        }
    });
}


var getType = function(file, record){
    for(var i = 0; i < videoFormats.length; i++){
        var ext = videoFormats[i];
        if(file.indexOf(ext) > -1 && record.type == ''){
            record.type = 'video';
        }
    }
    for(var i = 0; i < audioFormats.length; i++){
        var ext = audioFormats[i];
        if(file.indexOf(ext) > -1 && record.type == ''){
            record.type = 'audio';
            record.count = typeof record.count == 'undefined' ? 1 : record.count + 1;
        }
    }
    for(var i = 0; i < documentFormats.length; i++){
        var ext = documentFormats[i];
        if(file.indexOf(ext) > -1 && record.type == ''){
            record.type = 'doc';
        }
    }
    for(var i = 0; i < inactivateFormats.length; i++){
        var ext = inactivateFormats[i];
        if(file.indexOf(ext) > -1){
            record.inactive = true;
        }
    }
    return record;
}

var getCategories = function(file, record){
    var ext = '.' + file.split('.')[file.split('.').length - 1];
    if(record.type == 'video' && videoFormats.indexOf(ext) > -1){
        record = getVideoCategories(file, record);
    }
    if(record.type == 'audio' && audioFormats.indexOf(ext) > -1){
        record = getAudioCategories(file, record);
    }
    if(record.type == 'doc' && documentFormats.indexOf(ext) > -1){
        record = getDocCategories(file, record);
    }
    return record;
}

var getVideoCategories = function(file, record){
    if(file.match(/season|episode|s[0-9]{2}e[0-9]{2}/i)){
        record.categories.push('show');
    }else if(file.match(/[0-9]+x[0-9]+/i)){
        record.categories.push('show');
    }else{
        record.categories.push('movie');
    }

    if(file.toLowerCase().indexOf('1080') > -1){
        record.tags.push('1080');
    }
    if(file.toLowerCase().indexOf('720') > -1){
        record.tags.push('720');
    }
    if(file.toLowerCase().indexOf('hd') > -1){
        record.tags.push('HD');
    }
    if(file.toLowerCase().indexOf('sd') > -1){
        record.tags.push('SD');
    }
    if(file.toLowerCase().indexOf('bdrip') > -1){
        record.tags.push('BDRIP');
    }
    if(file.toLowerCase().indexOf('xxx') > -1){
        record.tags.push('XXX');
    }
    if(file.toLowerCase().indexOf('dvdrip') > -1){
        record.tags.push('DVDRIP');
    }
    return record;
}

var getAudioCategories = function(file, record){
    if(record.count > 3){
        record.categories.push('album');
    }
    return record;
}

var getDocCategories = function(file, record){
    if(file.indexOf('.epub')){
        record.categories.push('ebook');
        record.tags.push('epub');
    }
    if(file.indexOf('.mobi')){
        record.categories.push('ebook');
        record.tags.push('mobi');
    }
    if(file.indexOf('.azw3')){
        record.categories.push('ebook');
        record.tags.push('kindle');
    }
    return record;
}

search();