# AlphaReign Scraper

AlphaReigns DHT Scraper, includes peer updater and categorizer

More Info Here: https://github.com/AlphaReign/AlphaReign

## Installation

-   Download or clone the repository
-   Install node
-   Install yarn
-   Install elasticsearch
-   Install mysql / mariadb / sqlite
-   Install pm2 globally (`yarn global install pm2`)
-   Update config.json (ElasticSearch variables if on a different host, Database variables)
-   Run yarn migrate (`yarn migrate`)
-   Start pm2 with Ecosystem file (`pm2 start ecosystem.config.js`)

## Updating

-   Stop running pm2 instances (`pm2 stop all`)
-   Download or pull the repository
-   Run yarn migrate (`yarn migrate`)
-   Start pm2 (`pm2 start all`)
