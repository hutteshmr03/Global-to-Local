const fs = require('fs');
const path = require('path');

const pages = [
  { file: 'home.html', route: '/' },
  { file: 'shop.html', route: '/shop' },
  { file: 'our-story.html', route: '/our-story' },
  { file: 'our-social-corner.html', route: '/our-social-corner' },
  { file: 'in-the-news.html', route: '/in-the-news' },
  { file: 'contact.html', route: '/contact' },
  { file: 'shipping-policy.html', route: '/shipping-policy' },
  { file: 'return-and-exchange-policy.html', route: '/return-and-exchange-policy' },
  { file: 'terms-and-conditions.html', route: '/terms-and-conditions' },
  { file: 'privacy-policy.html', route: '/privacy-policy' },
];

// Let's also check category pages
const categoryPages = fs.readdirSync('content-audit/pages').filter(f => f.startsWith('product-category__'));
categoryPages.forEach(f => {
  const slug = f.replace('product-category__', '').replace('.html', '');
  pages.push({ file: f, route: `/product-category/${slug}` });
});

let markdown = `# Global to Local — Page Inventory & Content Audit\n\n`;
markdown += `Audited from live site at https://gtl-khaki.vercel.app/\n\n`;

pages.forEach(p => {
  const filePath = path.join('content-audit/pages', p.file);
  if (!fs.existsSync(filePath)) return;
  const html = fs.readFileSync(filePath, 'utf8');

  // Extract title
  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch ? titleMatch[1] : '';

  // Extract meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i) ||
                    html.match(/<meta\s+content=["']([^"']+)["']\s+name=["']description["']/i);
  const description = descMatch ? descMatch[1] : '';

  // Extract headings
  const headings = [];
  const hRegex = /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let hMatch;
  while ((hMatch = hRegex.exec(html)) !== null) {
    const cleanText = hMatch[2].replace(/<[^>]+>/g, '').trim();
    if (cleanText) headings.push(`H${hMatch[1]}: ${cleanText}`);
  }

  // Extract visible text summary (remove scripts, styles, tags)
  let cleanBody = html.replace(/<script[\s\S]*?<\/script>/gi, '')
                      .replace(/<style[\s\S]*?<\/style>/gi, '')
                      .replace(/<svg[\s\S]*?<\/svg>/gi, '')
                      .replace(/<[^>]+>/g, ' ')
                      .replace(/\s+/g, ' ')
                      .trim();

  markdown += `## Route: \`${p.route}\`\n\n`;
  markdown += `- **Source File:** \`${p.file}\`\n`;
  markdown += `- **Page Title:** ${title}\n`;
  markdown += `- **Meta Description:** ${description || '*(None)*'}\n\n`;
  markdown += `### Headings\n`;
  if (headings.length > 0) {
    headings.forEach(h => { markdown += `- ${h}\n`; });
  } else {
    markdown += `*(No headings)*\n`;
  }
  markdown += `\n### Visible Text Extract\n\n`;
  markdown += `\`\`\`\n${cleanBody.slice(0, 1500)}${cleanBody.length > 1500 ? '...' : ''}\n\`\`\`\n\n`;
  markdown += `---\n\n`;
});

fs.writeFileSync('content-audit/page-inventory.md', markdown, 'utf8');
console.log('Saved content-audit/page-inventory.md');
