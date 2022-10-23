const glob = require("glob");
const fs = require("fs");

const removeFirstLine = (lines) => lines.substring(lines.indexOf("\n") + 1);
const lastItem = (thePath) => thePath.substring(thePath.lastIndexOf("/") + 1);

const directories = glob.sync("out/*");
for (const directory of directories) {
  let outputData = "#EXTM3U\n";
  const files = glob.sync(`${directory}/*`);
  for (const file of files) {
    outputData += removeFirstLine(fs.readFileSync(file).toString());
  }
  const name = lastItem(directory);
  fs.writeFileSync(`out/${name}.m3u`, outputData);
}
