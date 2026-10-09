import urllib.request
import re
import json
import os
import time

def fetch_url(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            return resp.read()
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def main():
    with open("content-audit/sitemap_urls.json", "r", encoding="utf-8") as f:
        urls = json.load(f)

    # Convert domain from globaltolocal.in to gtl-khaki.vercel.app for crawling
    all_chunks = set()
    all_css = set()
    pages_data = {}

    print(f"Crawling {len(urls)} URLs from sitemap...")
    for u in urls:
        path = u.replace("https://globaltolocal.in", "")
        if not path:
            path = "/"
        live_url = "https://gtl-khaki.vercel.app" + path
        print(f"Fetching {live_url}")
        content_bytes = fetch_url(live_url)
        if not content_bytes:
            continue
        content_str = content_bytes.decode("utf-8", errors="replace")
        
        # Save HTML
        safe_name = path.strip("/").replace("/", "__")
        if not safe_name:
            safe_name = "home"
        with open(f"content-audit/pages/{safe_name}.html", "w", encoding="utf-8") as f:
            f.write(content_str)
            
        # Find all script src
        scripts = re.findall(r'src="(/_next/static/[^"]+)"', content_str)
        for s in scripts:
            all_chunks.add(s)
            
        # Find all css href
        css_list = re.findall(r'href="(/_next/static/css/[^"]+)"', content_str)
        for c in css_list:
            all_css.add(c)
            
        time.sleep(0.05)

    print(f"Found {len(all_chunks)} unique JS chunks and {len(all_css)} CSS files.")
    
    # Download all JS chunks and CSS
    os.makedirs("content-audit/static/chunks", exist_ok=True)
    os.makedirs("content-audit/static/css", exist_ok=True)
    
    for js in all_chunks:
        js_url = "https://gtl-khaki.vercel.app" + js
        print(f"Downloading {js_url}")
        data = fetch_url(js_url)
        if data:
            fname = os.path.basename(js)
            with open(f"content-audit/static/chunks/{fname}", "wb") as f:
                f.write(data)
                
    for css in all_css:
        css_url = "https://gtl-khaki.vercel.app" + css
        print(f"Downloading {css_url}")
        data = fetch_url(css_url)
        if data:
            fname = os.path.basename(css)
            with open(f"content-audit/static/css/{fname}", "wb") as f:
                f.write(data)

if __name__ == "__main__":
    main()
