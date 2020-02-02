# tvheadend_dvb_service_dump ![Actions Status](https://github.com/jrcichra/tvheadend_dvb_service_dump/workflows/Node.js%20CI/badge.svg) 
Writes out m3u files, one for each tuner/channel/subchannel

# Install & Run
+ Have a recent version of node installed, I recommend NodeSource's instructions: https://github.com/nodesource/distributions#installation-instructions
+ Globally install yarn `npm install -g yarn`
+ Clone this repository `git clone https://github.com/jrcichra/tvheadend_dvb_service_dump.git`
+ `cd tvheadend_dvb_service_dump`
+ `yarn install` to pull all dependencies (such as puppeteer)
+ run with `node main.js -u "<URL>" -o "<OUTPUT_DIR>"`


# Usage
```bash
  Usage: main.js [options] [command]
  
  Commands:
    help     Display help
    version  Display version
  
  Options:
    -d, --delay <n>  number of millisecond to delay between clicks (defaults to 1000)
    -h, --help       Output usage information
    -o, --o          output directory for m3u files
    -u, --url        url:port of tvheadend to scrape
    -v, --version    Output the version number
  
```
