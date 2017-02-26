# scraper
AlphaReigns DHT Scraper, includes peer updater and categorizer


##Installation

1. Download or clone the repository
2. Install node / npm
3. Install elasticsearch (if you install on another server, you need to change the endpoint in add.js, categorize.js, scrape.js)
4. Install pm2 globally (npm install -g pm2)
5. Start scripts with pm2


##Scripts

###add.js

####Start

    pm2 start add.js

####Function

add.js will listen to the DHT network and add any torrents it seems coming through the network

###scrape.js

####Start

    pm2 start scrape.js

####Function

scrape.js will update the last updated torrent with seeders and leechers info by scraping a tracker.  We use coppersurfer.tk by default, but this can be changed

###categorize.js

####Start

    pm2 start categorize.js

####Function

categorize.js will try and parse the name of the torrent and files to determine the type of torrent it is