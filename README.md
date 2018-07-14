# AlphaReign

AlphaReign DHT Scraper is a node project that joins the BitTorrent DHT network and will scrape torrent data that passes along the node.

## Installation

* Install Node (version 8 or greater)
* Install pm2 globally with yarn / npm `yarn global add pm2` or `npm i -g pm2`
* Install packages with yarn / npm `yarn` or `npm install`
* Change the store in `src/config.js` to sqlite or mongodb
* Run to `pm2 start ecosystem.config.js`

## Data Stores

Currently, Alpha Reign supports sqlite and monogodb as a datastore.  There are plans to support elasticsearch and redis for searchability and caching.

It is highly recommended to use monogodb instead of sqlite for production uses as sqlite will require high disk usage for all the writes that will be made.

Changing the datastore can be done by changing the store value in ```src/config.js```

### MongoDB

```
store: 'mongodb',
```

### SQLite

```
store: 'sqlite',
```
