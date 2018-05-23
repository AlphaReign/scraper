# AlphaReign

The goal of AlphaRegin is create a piece of software that creates a network on top of the BitTorrent DHT Network.  This extra network layer is meant negotiate the list of torrents that exists in the DHT Network.  On top of that, it will provide a way to search through torrents


## AutoDiscovery of Torrents
	This will be handled by the BitTorrent DHT Scraper here: https://github.com/AlphaReign/scraper

## AlphaReign Network

This is the network that lives on top of the BitTorrent DHT Network.  It's goal is to share torrent hashes, torrent info and other nodes


### AR API

This is a working copy and may drastically change

* HTTPS GET /nodes - Returns a list of nodes
```
{
	...payload,
	payload: {
		nodes: [
			{
				address: '255.255.255.255',
				port: '80'
			},
			{
				address: 'bootstrap.alphareign.com',
				port: '80'
			}
		]
	}
}
```
* HTTPS GET /hashes - Returns a list of torrent hashes
```
{
	...payload,
	payload: {
		hashes: [
			'e4be9e4db876e3e3179778b03e906297be5c8dbe',
			'ddee5cb75c12f3165ef79a12a5cd6158bef029ad'
		]
	}
}
```
* HTTPS GET /hash/{infohash} - Returns torrent information

