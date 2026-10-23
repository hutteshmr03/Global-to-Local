import os
import shutil

dist_dir = 'dist'
live_dir = 'dist_live'
os.makedirs(live_dir, exist_ok=True)

# Copy index.html
shutil.copy2(os.path.join(dist_dir, 'index.html'), os.path.join(live_dir, 'index.html'))

# Copy assets
live_assets = os.path.join(live_dir, 'assets')
os.makedirs(live_assets, exist_ok=True)

new_js = None
new_css = None
for f in os.listdir(os.path.join(dist_dir, 'assets')):
    src = os.path.join(dist_dir, 'assets', f)
    dst = os.path.join(live_assets, f)
    shutil.copy2(src, dst)
    if f.endswith('.js') and not new_js:
        new_js = f
    if f.endswith('.css') and not new_css:
        new_css = f

print(f"New JS bundle: {new_js}")
print(f"New CSS bundle: {new_css}")

# Alias to all known previous bundle names
legacy_bundles = ['index-Dityyu4I.js', 'index-CptRI5Dd.js', 'index-TgqMtV40.js', 'index-B6az3yA0.js', 'index-CPq8Ofw5.js', 'index-C3wiUHt2.js', 'index-DMUcV2ny.js', 'index-iXfLwrxW.js', 'index-BcsolVHe.js', 'index-B0Y-ixBk.js']
for legacy in legacy_bundles:
    alias_dst = os.path.join(live_assets, legacy)
    shutil.copy2(os.path.join(live_assets, new_js), alias_dst)
    print(f"Aliased {new_js} -> {legacy}")

print("Assets successfully aligned in dist_live/")
