const fs = require('fs');
const path = require('path');

const chunk130 = fs.readFileSync('content-audit/static/chunks/130-118839b689c760d6.js', 'utf8');
const chunk822 = fs.readFileSync('content-audit/static/chunks/822-4bfc6e9783f8e3a3.js', 'utf8');
const chunk943 = fs.readFileSync('content-audit/static/chunks/943-fa88ace1d27d1508.js', 'utf8');

console.log("Chunk 130 sample:");
console.log(chunk130.slice(0, 500));
console.log("\nChunk 822 sample:");
console.log(chunk822.slice(0, 500));
console.log("\nChunk 943 sample:");
console.log(chunk943.slice(0, 500));
