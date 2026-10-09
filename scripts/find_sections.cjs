const fs = require('fs');
const path = require('path');

const chunkDir = 'content-audit/static/chunks';
const files = fs.readdirSync(chunkDir);

for (const file of files) {
  if (!file.endsWith('.js')) continue;
  const content = fs.readFileSync(path.join(chunkDir, file), 'utf8');
  
  if (content.includes('Frequently asked questions') || content.includes('Where do your products come from') || content.includes('Tarcar Mansion')) {
    console.log(`FAQs / Contact found in ${file}`);
  }
  if (content.includes('Our Story') || content.includes('Fontainhas') && content.includes('supermarket')) {
    console.log(`Story / Brand content found in ${file}`);
  }
  if (content.includes('Return & Exchange') || content.includes('Shipping Policy') || content.includes('Terms & Conditions') || content.includes('Privacy Policy')) {
    console.log(`Policies found in ${file}`);
  }
  if (content.includes('Press') || content.includes('Herald') || content.includes('Navhind Times') || content.includes('Gomantak')) {
    console.log(`Press / News found in ${file}`);
  }
}
