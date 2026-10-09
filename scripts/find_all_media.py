import glob
import re
import os
import json
import urllib.request

def main():
    # Retry shell-chopsticks.jpg
    target = "https://gtl-khaki.vercel.app/images/catalog/shell-chopsticks.jpg"
    try:
        req = urllib.request.Request(target, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            with open("content-audit/assets/images/catalog/shell-chopsticks.jpg", "wb") as f:
                f.write(resp.read())
            print("Successfully downloaded shell-chopsticks.jpg!")
    except Exception as e:
        print("Retry error:", e)

    # Search all HTML files for any media / static references
    html_files = glob.glob("content-audit/pages/*.html")
    all_media = set()
    for hf in html_files:
        with open(hf, "r", encoding="utf-8") as f:
            html = f.read()
        # Find all src, href, poster
        for src in re.findall(r'(?:src|href|poster)="([^"]+)"', html):
            if any(src.lower().endswith(ext) for ext in ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.svg', '.mp3', '.wav', '.mp4', '.woff2', '.ico']):
                all_media.add(src)

    print(f"Total media/assets referenced in HTML: {len(all_media)}")
    for m in sorted(all_media):
        print("  ", m)

if __name__ == "__main__":
    main()
