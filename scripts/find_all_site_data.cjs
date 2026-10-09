const fs = require('fs');

const chunk822 = fs.readFileSync('content-audit/static/chunks/822-4bfc6e9783f8e3a3.js', 'utf8');
const chunk943 = fs.readFileSync('content-audit/static/chunks/943-fa88ace1d27d1508.js', 'utf8');
const chunk130 = fs.readFileSync('content-audit/static/chunks/130-118839b689c760d6.js', 'utf8');

// Let's inspect module 2366 or other config modules
console.log("Searching for site config, contact, ticker, reviews, maker steps...");

function inspectAround(chunk, query) {
  const idx = chunk.indexOf(query);
  if (idx !== -1) {
    console.log(`=== Match for "${query}" ===`);
    console.log(chunk.slice(Math.max(0, idx - 100), Math.min(chunk.length, idx + 1500)));
  }
}

inspectAround(chunk943, '2366:');
inspectAround(chunk822, '2366:');
inspectAround(chunk822, 'Handmade in Goa');
inspectAround(chunk943, 'Handmade in Goa');
inspectAround(chunk822, 'Visitors');
inspectAround(chunk943, 'Visitors');
inspectAround(chunk822, 'Frequently asked questions');
inspectAround(chunk943, 'Frequently asked questions');
