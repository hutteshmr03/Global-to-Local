const fs = require('fs');
const path = require('path');

const chunkDir = 'content-audit/static/chunks';
const files = fs.readdirSync(chunkDir);

files.forEach(f => {
  if (f.startsWith('app') || f.startsWith('page') || f.includes('page-')) {
    const code = fs.readFileSync(path.join(chunkDir, f), 'utf8');
    console.log(`Page chunk: ${f} (${code.length} bytes)`);
  }
});
