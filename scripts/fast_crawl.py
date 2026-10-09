import concurrent.futures
import json
import os
import re
import sys
import time
import urllib.request
import xml.etree.ElementTree as ET

BASE_URL = "https://gtl-khaki.vercel.app"

def fetch_url(url, timeout=10):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.read()
    except Exception as e:
        print(f"Error fetching {url}: {e}", flush=True)
        return None

def main():
    os.makedirs("content-audit/pages", exist_ok=True)
    os.makedirs("content-audit/static/chunks", exist_ok=True)
    os.makedirs("content-audit/static/css", exist_ok=True)
    os.makedirs("content-audit/assets", exist_ok=True)

    with open("content-audit/sitemap_urls.json", "r", encoding="utf-8") as f:
        urls = json.load(f)

    print(f"Fetching {len(urls)} pages concurrently with 16 workers...", flush=True)
    
    def process_url(u):
        path = u.replace("https://globaltolocal.in", "")
        if not path:
            path = "/"
        live_url = BASE_URL + path
        data = fetch_url(live_url)
        if data:
            safe_name = path.strip("/").replace("/", "__")
            if not safe_name:
                safe_name = "home"
            with open(f"content-audit/pages/{safe_name}.html", "wb") as pf:
                pf.write(data)
            return (live_url, data.decode("utf-8", errors="replace"))
        return (live_url, None)

    all_chunks = set()
    all_css = set()
    all_images = set()

    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as executor:
        results = list(executor.map(process_url, urls))

    print("All sitemap pages fetched. Extracting assets and chunks...", flush=True)

    for url, html in results:
        if not html:
            continue
        # chunks
        for s in re.findall(r'src="(/_next/static/[^"]+)"', html):
            all_chunks.add(s)
        # css
        for c in re.findall(r'href="(/_next/static/css/[^"]+)"', html):
            all_css.add(c)
        # images / audio
        for img in re.findall(r'src="([^"]+\.(?:jpg|jpeg|png|webp|avif|svg|mp3|wav|ogg))"', html, re.IGNORECASE):
            all_images.add(img)
        for img in re.findall(r'href="([^"]+\.(?:jpg|jpeg|png|webp|avif|svg|ico))"', html, re.IGNORECASE):
            all_images.add(img)

    print(f"Found {len(all_chunks)} chunks, {len(all_css)} CSS files. Downloading chunks and CSS...", flush=True)

    def download_chunk(js):
        js_url = BASE_URL + js
        data = fetch_url(js_url)
        if data:
            fname = os.path.basename(js)
            with open(f"content-audit/static/chunks/{fname}", "wb") as f:
                f.write(data)

    def download_css(css):
        css_url = BASE_URL + css
        data = fetch_url(css_url)
        if data:
            fname = os.path.basename(css)
            with open(f"content-audit/static/css/{fname}", "wb") as f:
                f.write(data)

    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as executor:
        list(executor.map(download_chunk, all_chunks))
        list(executor.map(download_css, all_css))

    print("Chunks and CSS downloaded successfully.", flush=True)

if __name__ == "__main__":
    main()
