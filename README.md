# AlphaReign Scraper

AlphaReigns DHT Scraper, includes peer updater and categorizer

More Info Here: https://github.com/AlphaReign/AlphaReign

## Notes

This scrape relies on storing the torrent data in a database. I recommend either mariadb or mysql. It will work with sqlite if you wish to have a portable database but doing so will require a high level of disk usage as sqlite writes to a single file.

## Installation

-   Download or clone the repository
-   Install node
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
