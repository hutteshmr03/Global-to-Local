import urllib.request
import re
import json
import os
import xml.etree.ElementTree as ET

def main():
    os.makedirs("content-audit", exist_ok=True)
    os.makedirs("content-audit/assets", exist_ok=True)
    os.makedirs("content-audit/pages", exist_ok=True)

    # 1. Fetch sitemap
    req = urllib.request.Request("https://gtl-khaki.vercel.app/sitemap.xml", headers={"User-Agent": "Mozilla/5.0"})
    xml_data = urllib.request.urlopen(req).read()
    root = ET.fromstring(xml_data)
    urls = [elem.text for elem in root.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
    print(f"Total URLs in sitemap: {len(urls)}")

    with open("content-audit/sitemap_urls.json", "w", encoding="utf-8") as f:
        json.dump(urls, f, indent=2)

    # Let's inspect the shop page HTML and JS chunks
    req = urllib.request.Request("https://gtl-khaki.vercel.app/shop", headers={"User-Agent": "Mozilla/5.0"})
    shop_html = urllib.request.urlopen(req).read().decode("utf-8")
    with open("content-audit/pages/shop.html", "w", encoding="utf-8") as f:
        f.write(shop_html)

    # Find JS bundles
    js_files = re.findall(r'src="(/_next/static/[^"]+)"', shop_html)
    print("Found JS files:", js_files)

    # Let's fetch the JS files and check if products or categories are bundled in them
    for js_path in js_files:
        js_url = "https://gtl-khaki.vercel.app" + js_path
        print("Fetching JS:", js_url)
        js_content = urllib.request.urlopen(urllib.request.Request(js_url, headers={"User-Agent": "Mozilla/5.0"})).read().decode("utf-8")
        js_name = os.path.basename(js_path)
        with open(f"content-audit/pages/{js_name}", "w", encoding="utf-8") as f:
            f.write(js_content)
        if "Chutneys & Spreads" in js_content or "Farsaan" in js_content:
            print(f"--> Products/Categories found in {js_name}!")

if __name__ == "__main__":
    main()
