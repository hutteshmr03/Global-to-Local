const fs = require('fs');

const chunks = ['content-audit/static/chunks/layout-35b543a9d1d76bcd.js', 'content-audit/static/chunks/822-4bfc6e9783f8e3a3.js', 'content-audit/static/chunks/943-fa88ace1d27d1508.js'];

chunks.forEach(c => {
  if (fs.existsSync(c)) {
    const code = fs.readFileSync(c, 'utf8');
    const idx = code.indexOf('Our Social Corner');
    if (idx !== -1) {
      console.log(`Match in ${c}:`);
      console.log(code.slice(Math.max(0, idx - 400), Math.min(code.length, idx + 600)));
    }
  }
});
