const fs = require('fs');

const chunk822 = fs.readFileSync('content-audit/static/chunks/822-4bfc6e9783f8e3a3.js', 'utf8');
const chunk943 = fs.readFileSync('content-audit/static/chunks/943-fa88ace1d27d1508.js', 'utf8');

// Let's write a script that regex-extracts arrays and objects or parses them
console.log("Chunk 822 size:", chunk822.length);
console.log("Chunk 943 size:", chunk943.length);

// Let's inspect functions/definitions in chunk 822
const matches822 = chunk822.match(/([a-zA-Z0-9_$]+)\s*=\s*(\[[^\]]*\]|\{[^}]*\})/g);
console.log("Matches in 822:", matches822 ? matches822.length : 0);
