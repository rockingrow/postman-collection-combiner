'use strict';

const postman = require('../config/postman');
const args = require('yargs/yargs')(process.argv.slice(2)).argv;
const fs = require('fs');
const path = require('path');
const { combine } = require('../dist/js/combiner');

const mainJson = require(args.main);
const subJson = require(args.sub);
const outputPath = args.output ||
  path.resolve(__dirname, `../json/output${postman.extension}`);

console.log('Main file: ' + mainJson);
console.log('Sub file: ' + subJson);
console.log('Output: ' + outputPath);


let { success, result: mergedJson, message } = combine(mainJson, subJson);
if (!success) {
  console.log(`Combine collection: ${message}`);
  return;
}
const jsonString = JSON.stringify(mergedJson);

fs.writeFile(outputPath, jsonString, 'utf8', err => {
  if (err) {
    console.log(`Error writing file: ${err}`);
  } else {
    console.log(`Successfully wrote output file at: ${outputPath}`);
  }
});

return;