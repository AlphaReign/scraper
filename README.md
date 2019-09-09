# AlphaReign Scraper

AlphaReigns DHT Scraper, includes peer updater and categorizer

More Info Here: https://github.com/AlphaReign/AlphaReign

## Notes

This scrape relies on storing the torrent data in a database. I recommend either mariadb or mysql. It will work with sqlite if you wish to have a portable database but doing so will require a high level of disk usage as sqlite writes to a single file.

## Installation

-   Download or clone the repository
-   Install node (Version 8 Required.  Higher versions might work)
-   Install yarn
-   Install elasticsearch
-   Install mysql / mariadb / sqlite
-   Install pm2 globally (`yarn global add pm2`)
-   Update config/index.js (ElasticSearch variables if on a different host, Database variables)
-   Run yarn (`yarn`)
-   Run yarn migrate (`yarn migrate`)
-   Start pm2 with Ecosystem file (`pm2 start ecosystem.config.js`)

## Updating

-   Stop running pm2 instances (`pm2 stop all`)
-   Download or pull the repository
-   Run yarn migrate (`yarn migrate`)
-   Start pm2 (`pm2 start all`)

# Docker
-   Build the image: `docker build -t alphareign/scraper:latest .`
-   Update `config/index.js` (Elasticsearch & Database may be on e.g. 172.17.0.1)
-   Run `yarn migrate`: `docker run --rm -v $(pwd)/config/index.js:/scraper/config/index.js alphareign/scraper:latest yarn migrate`
-   Start the scraper: `docker run -d --name alphareign-scraper -v $(pwd)/config/index.js:/scraper/config/index.js -p 6881:6881 alphareign/scraper:latest`
