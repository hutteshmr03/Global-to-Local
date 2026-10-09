const fs = require('fs');

const css = fs.readFileSync('content-audit/static/css/fc1ff755c46d4fce.css', 'utf8');

console.log("CSS length:", css.length);

// Find all CSS root variables
const rootVars = {};
const varMatches = css.match(/--[a-zA-Z0-9_-]+:\s*[^;]+/g);
if (varMatches) {
  varMatches.forEach(vm => {
    const [k, v] = vm.split(':');
    rootVars[k.trim()] = v.trim();
  });
}

console.log("Root variables found:", Object.keys(rootVars).length);
for (let k in rootVars) {
  console.log(`  ${k}: ${rootVars[k]}`);
}

// Let's also inspect font faces
const fontFaces = css.match(/@font-face\s*\{[^}]+\}/g);
console.log("\nFont faces:", fontFaces ? fontFaces.length : 0);
if (fontFaces) {
  fontFaces.forEach(ff => console.log(ff));
}

// Let's search for hex colors or rgb/hsl
const colors = new Set(css.match(/#[0-9a-fA-F]{3,8}|rgba?\([^)]+\)|hsla?\([^)]+\)/g));
console.log("\nUnique colors found in CSS:", colors.size);
console.log(Array.from(colors).slice(0, 30));
