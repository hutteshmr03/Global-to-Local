const fs = require('fs');

const code = fs.readFileSync('content-audit/static/chunks/layout-35b543a9d1d76bcd.js', 'utf8');
const idx = code.indexOf('function w(e){');
if (idx !== -1) {
  console.log(code.slice(idx - 1000, idx + 2500));
}
