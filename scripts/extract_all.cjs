const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = {
  self: {},
  window: {},
  document: { createElement: () => ({ style: {} }), head: { appendChild: () => {} } },
  navigator: { userAgent: 'node' },
  location: { href: 'https://gtl-khaki.vercel.app', pathname: '/' },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Intl: Intl,
  String: String,
  Number: Number,
  Array: Array,
  Object: Object,
  Boolean: Boolean,
  Date: Date,
  Math: Math,
  RegExp: RegExp,
  console: console,
};
context.self = context.window = context;

vm.createContext(context);

const modules = {};
context.webpackChunk_N_E = {
  push: function([ids, mods]) {
    for (let k in mods) {
      modules[k] = mods[k];
    }
  }
};
context.self.webpackChunk_N_E = context.webpackChunk_N_E;

const chunkFiles = fs.readdirSync('content-audit/static/chunks');
for (let file of chunkFiles) {
  if (file.endsWith('.js')) {
    const code = fs.readFileSync(path.join('content-audit/static/chunks', file), 'utf8');
    try {
      vm.runInContext(code, context);
    } catch (e) {
      // ignore
    }
  }
}

console.log("Total extracted modules:", Object.keys(modules).length);

const installedModules = {};
function __webpack_require__(moduleId) {
  if (installedModules[moduleId]) {
    return installedModules[moduleId].exports;
  }
  const module = installedModules[moduleId] = {
    exports: {}
  };
  const d = (target, name, getter) => {
    if (typeof name === 'object') {
      for (let key in name) {
        try {
          Object.defineProperty(target, key, { enumerable: true, get: name[key] });
        } catch (e) {}
      }
    } else {
      try {
        Object.defineProperty(target, name, { enumerable: true, get: getter });
      } catch (e) {}
    }
  };
  const r = (exports) => {
    try {
      if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
        Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
      }
      Object.defineProperty(exports, '__esModule', { value: true });
    } catch (e) {}
  };
  const req = (id) => {
    try {
      return __webpack_require__(id);
    } catch (e) {
      return {};
    }
  };
  req.d = d;
  req.r = r;

  if (modules[moduleId]) {
    try {
      modules[moduleId](module, module.exports, req);
    } catch (e) {
      // ignore
    }
  }
  return module.exports;
}

const allData = {};
for (let id in modules) {
  try {
    const exp = __webpack_require__(id);
    if (exp) {
      allData[id] = exp;
    }
  } catch (e) {}
}

let foundProducts = null;
let foundCategories = null;
let foundFaqs = null;
let foundReviews = null;
let foundVideos = null;
let foundPress = null;
let foundMakers = null;
let foundShelves = null;
let foundOther = {};

for (let id in allData) {
  const exp = allData[id];
  for (let key in exp) {
    let val;
    try {
      val = exp[key];
    } catch (e) {
      continue;
    }
    if (Array.isArray(val)) {
      if (val.length > 50 && val[0] && (val[0].slug || val[0].name || val[0].price || val[0].title)) {
        console.log(`Module ${id}.${key} has ${val.length} products!`);
        foundProducts = val;
      } else if (val.length === 13 && val[0] && val[0].slug && val[0].name) {
        console.log(`Module ${id}.${key} has 13 categories!`);
        foundCategories = val;
      } else if (val.length >= 15 && val[0] && (val[0].question || val[0].q) && (val[0].answer || val[0].a)) {
        console.log(`Module ${id}.${key} has ${val.length} FAQs!`);
        foundFaqs = val;
      } else if (val.length === 3 && val[0] && (val[0].author || val[0].author_name || val[0].body || val[0].quote)) {
        console.log(`Module ${id}.${key} has ${val.length} reviews!`);
        foundReviews = val;
      } else if (val.length > 0 && (val[0].step || val[0].number || val[0].heading || val[0].title)) {
        console.log(`Module ${id}.${key} array length: ${val.length}`);
        foundOther[`array_${id}_${key}`] = val;
      }
    } else if (val && typeof val === 'object') {
      if (val.street && val.rice && val.kunbi) {
        console.log(`Module ${id}.${key} has videos/media objects!`);
        foundVideos = val;
      }
    }
  }
}

// Save extracted data
fs.writeFileSync('content-audit/extracted_data.json', JSON.stringify({
  products: foundProducts,
  categories: foundCategories,
  faqs: foundFaqs,
  reviews: foundReviews,
  videos: foundVideos,
  other: foundOther,
}, null, 2));

console.log("Extracted Data saved to content-audit/extracted_data.json");
if (foundProducts) console.log("Total Products:", foundProducts.length);
if (foundCategories) console.log("Total Categories:", foundCategories.length);
if (foundFaqs) console.log("Total FAQs:", foundFaqs.length);
if (foundReviews) console.log("Total Reviews:", foundReviews.length);
