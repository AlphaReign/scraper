# AlphaReign Scraper

AlphaReigns DHT Scraper, includes peer updater and categorizer

More Info Here: https://github.com/AlphaReign/AlphaReign

## Installation

1.  Download or clone the repository
2.  Install node
3.  Install yarn
4.  Install elasticsearch
5.  Install pm2 globally (`yarn global install pm2`)
6.  Update config.json
7.  Run yarn migrate (`yarn migrate`)
8.  Start pm2 with Ecosystem file (`pm2 start ecosystem.config.js`)

## Updating

1.  Stop running pm2 instances (`pm2 stop all`)
2.  Download or pull the repository
3.  Run yarn migrate (`yarn migrate`)
4.  Start pm2 (`pm2 start all`)
