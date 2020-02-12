const puppeteer = require('puppeteer');
const args = require('args');
args
  .option('url', 'url:port of tvheadend to scrape')
  .option('o', 'output directory for m3u files')
  .option('delay', 'number of millisecond to delay between clicks', 1000)

const flags = args.parse(process.argv);
const delay = flags.delay;

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  console.log(flags)
  await page.goto(flags.url, {
    waitUntil: 'networkidle2'
  });

  //Handle clicking on the wrench in javascript
  await page.evaluate(() => {
    let elements = document.getElementsByClassName('wrench');
    let wrench = elements[0].parentElement.parentElement.parentElement;
    wrench.click();
  });
  //Give it some time
  await page.waitFor(delay);
  //Handle clicking on DVB Inputs in javascript
  await page.evaluate(() => {
    let elements = document.getElementsByClassName('hardware');
    let dvb = elements[0].parentElement.parentElement.parentElement;
    dvb.click();
  });
  //Give it some time
  await page.waitFor(delay);
  //Handle clicking on services in javascript
  await page.evaluate(() => {
    let elements = document.getElementsByClassName('services');
    let services = elements[0].parentElement.parentElement.parentElement;
    services.click();
  });
  //Give it some time
  await page.waitFor(delay);
  //Set Per Page to All and press Enter
  await page.evaluate(() => {
    for (const d of document.querySelectorAll("div")) {
      if (d.textContent == "Per page") {
        //Find the arrow next to per page
        let per_page = d.parentElement.parentElement.children[3].children[0].children[1];
        //Click it
        per_page.click();
        //Find All and click it
        for (const d of document.querySelectorAll("div")) {
          if (d.textContent == "All") {
            d.click();
          }
        }
      }
    }
  });
  //Give it some time
  await page.waitFor(delay);

  //Figure out all the table details
  let table = await page.evaluate(() => {
    let table = [];
    for (const a of document.querySelectorAll("a")) {
      if (a.textContent == "Play") {
        //We found a cell in a table that's in a row, we can use this to walk to the proper location
        let o = new Object();
        let row = a.parentElement.parentElement.parentElement;
        // console.log(row);
        o.url = a.href;
        o.name = row.cells[3].textContent;
        o.service = row.cells[4].textContent;
        o.input = row.cells[9].textContent.replace('_', '');
        o.mux = row.cells[10].textContent;
        o.channel = parseInt(row.cells[13].textContent);
        o.subchannel = parseInt(row.cells[14].textContent);
        table.push(o);
      }
    }
    return table;
  });

  //At this point we've built a table with a url for each mux/input with some details
  console.log(table.length);

  //We don't need a dedicated browser anymore, we got the data we need, going to use an HTTP downloading library instead
  await browser.close();
  //Initiate a download on every url, giving it a filename with attributes from the table
  const fs = require('fs');
  const download = require('download');


  let good_count = 0;
  let skipped_count = 0;
  for (let row of table) {
    let f = false;
    let data = await download(row.url);
    let filename = `${flags.o}/${row.channel}-${row.subchannel}_${row.input}`;
    if (row.name.trim() != "") {
      filename += `_${row.name.trim().replace(' ', '_')}`;
    }
    filename += '.m3u';
    // Check if the file already exits
    if (fs.existsSync(filename)) {
      console.warn(`${filename} already exists, skipping...`)
      skipped_count++;
      f = true;
    } else {
      good_count++;
    }
    fs.writeFileSync(filename, data);
    if (!f) {
      console.log(`Wrote out: ${filename}`);
    }
  }
  console.log(`Script complete: Wrote ${good_count} files and skipped ${skipped_count} because the file already existed (likely some duplicate tvheadend entries on disk / in the webui)`);
})();
