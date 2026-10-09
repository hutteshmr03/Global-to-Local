import concurrent.futures
import json
import os
import urllib.request

BASE_URL = "https://gtl-khaki.vercel.app"

def download_asset(asset_path):
    if not asset_path:
        return
    url = BASE_URL + asset_path if asset_path.startswith("/") else BASE_URL + "/" + asset_path
    rel_path = asset_path.lstrip("/")
    local_path = os.path.join("content-audit", "assets", rel_path)
    os.makedirs(os.path.dirname(local_path), exist_ok=True)
    
    if os.path.exists(local_path) and os.path.getsize(local_path) > 0:
        return (asset_path, True, "exists")
        
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = resp.read()
            with open(local_path, "wb") as f:
                f.write(data)
            return (asset_path, True, len(data))
    except Exception as e:
        return (asset_path, False, str(e))

def main():
    with open("content-audit/all_asset_urls.json", "r", encoding="utf-8") as f:
        asset_urls = json.load(f)

    print(f"Downloading {len(asset_urls)} assets concurrently with 16 workers...", flush=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=16) as executor:
        results = list(executor.map(download_asset, asset_urls))

    success = [r for r in results if r and r[1]]
    failed = [r for r in results if r and not r[1]]
    print(f"Downloaded {len(success)} assets successfully. Failed: {len(failed)}", flush=True)
    if failed:
        for f in failed:
            print(f"  Failed: {f[0]} ({f[2]})", flush=True)

if __name__ == "__main__":
    main()
