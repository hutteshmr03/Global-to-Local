const fs = require('fs');

const chunk822 = fs.readFileSync('content-audit/static/chunks/822-4bfc6e9783f8e3a3.js', 'utf8');
const chunk943 = fs.readFileSync('content-audit/static/chunks/943-fa88ace1d27d1508.js', 'utf8');

function searchMatches(chunk, name) {
  console.log(`\n================= SEARCH IN ${name} =================`);
  const regexes = [
    /\[\{question:[^\]]+\}\]/g,
    /\[\{author:[^\]]+\}\]/g,
    /\[\{step:[^\]]+\}\]/g,
    /\[\{num:[^\]]+\}\]/g,
    /\[\{number:[^\]]+\}\]/g,
    /\[\{title:[^\]]+\}\]/g,
    /ticker|fact|facts/gi,
    /review|reviews|guestbook|visitor/gi,
    /faq|faqs/gi,
  ];
  
  // Let's print all module keys and exported names
  const moduleDefs = chunk.match(/([0-9]+):\((?:e,t,a|e,a,t)\)=>\{/g);
  console.log(`Module defs in ${name}:`, moduleDefs);
}

searchMatches(chunk822, '822');
searchMatches(chunk943, '943');
