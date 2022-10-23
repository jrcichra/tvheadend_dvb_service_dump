const puppeteer = require("puppeteer");
const args = require("args");
args
  .option("url", "url:port of tvheadend to scrape")
  .option("o", "output directory for m3u files")
  .option("delay", "number of millisecond to delay between clicks", 1000);

const flags = args.parse(process.argv);
const delay = flags.delay;

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  console.log(flags);
  await page.goto(flags.url, {
    waitUntil: "networkidle2",
  });

  //Handle clicking on the wrench in javascript
  await page.evaluate(() => {
    let elements = document.getElementsByClassName("wrench");
    let wrench = elements[0].parentElement.parentElement.parentElement;
    wrench.click();
  });
  //Give it some time
  await page.waitForTimeout(delay);
  //Handle clicking on Television in javascript
  await page.evaluate(() => {
    let elements = document.getElementsByClassName("television");
    let dvb = elements[0].parentElement.parentElement.parentElement;
    dvb.click();
  });
  //Give it some time
  await page.waitForTimeout(delay);
  //Set Per Page to All and press Enter
  await page.evaluate(() => {
    for (const d of document.querySelectorAll("div")) {
      if (d.textContent == "Per page") {
        //Find the arrow next to per page
        let per_page =
          d.parentElement.parentElement.children[3].children[0].children[1];
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
  await page.waitForTimeout(delay);

  //Figure out all the table details
  let table = await page.evaluate(() => {
    let table = [];
    for (const play of document.getElementsByClassName("playlink")) {
      let url = play.parentElement;
      let row = play.parentElement.parentElement.parentElement.parentElement;
      let o = new Object();
      o.url = url.href;
      o.name = row.cells[3].textContent.trim();
      o.channel = row.cells[4].textContent.split(".")[0].trim();
      o.subchannel = row.cells[4].textContent.split(".")[1].trim();
      o.input = row.cells[12].textContent
        .split("/")[0]
        .split(" ")
        .join("_")
        .trim();
      o.mux = row.cells[12].textContent
        .split("/")[1]
        .split(" ")
        .join("_")
        .trim();
      table.push(o);
    }
    return table;
  });

  //At this point we've built a table with a url for each mux/input with some details
  console.log(table);

  //We don't need a dedicated browser anymore, we got the data we need, going to use an HTTP downloading library instead
  await browser.close();
  //Initiate a download on every url, giving it a filename with attributes from the table
  const fs = require("fs");
  const download = require("download");

  let good_count = 0;
  let skipped_count = 0;
  for (let row of table) {
    let f = false;
    let data = await download(row.url);
    let hostname = flags.url.split(":")[1].split("/").join("");
    let filename = `${flags.o}/${row.channel}.${row.subchannel}_${row.name}_(${hostname})`;
    filename += ".m3u";
    // Check if the file already exits
    if (fs.existsSync(filename)) {
      console.warn(`${filename} already exists, skipping...`);
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
  console.log(
    `Script complete: Wrote ${good_count} files and skipped ${skipped_count} because the file already existed (likely some duplicate tvheadend entries on disk / in the webui)`
  );
})();
