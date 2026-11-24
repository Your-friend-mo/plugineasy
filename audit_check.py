import os
import glob
import re
import json

BASE_DIR = r"c:\Users\m\Documents\plugineasy"
APP_DIR = os.path.join(BASE_DIR, "app")

with open(os.path.join(BASE_DIR, "products.json"), "r", encoding="utf-8") as f:
    products = json.load(f)

keyword_configs = [
    ("www-plugineasy-com.html", "www plugineasy com"),
    ("www-dot-plugineasy-dot-com.html", "www.plugineasy.com"),
    ("www-dot-plugineasy-dot-con.html", "www.plugineasy.con"),
    ("plugineasy-com.html", "plugineasy com"),
    ("plugineasy-dot-com-reddit.html", "plugineasy.com reddit"),
    ("www-plugineasy-com-download.html", "www plugineasy com download"),
    ("www-plugineasy-con.html", "www plugineasy con"),
    ("plugineasy-con.html", "plugineasy con"),
    ("www-plugineasy.html", "www plugineasy"),
    ("plugineasy-com-safe.html", "plugineasy com safe"),
]

trust_pages = ["about.html", "contact.html", "privacy.html", "terms.html"]

all_files = ["index.html"] + [fn for fn, _ in keyword_configs] + trust_pages + [
    f"app/{p['slug']}.html" for p in products
]

print(f"==================================================")
print(f"   STARTING COMPREHENSIVE AUDIT OF ALL {len(all_files)} PAGES")
print(f"==================================================")

errors = []
success_count = 0

# 1. Check Keywords
print("\n--- CHECK 1: KEYWORD DENSITY (Target: EXACTLY 30) ---")
# Homepage
with open(os.path.join(BASE_DIR, "index.html"), "r", encoding="utf-8") as f:
    c = f.read()
cnt = len(re.findall(re.escape("plugineasy"), c, re.IGNORECASE))
if cnt == 30:
    success_count += 1
else:
    errors.append(f"index.html: 'plugineasy' count is {cnt} (expected 30)")

# 10 Keyword pages
for fn, kw in keyword_configs:
    with open(os.path.join(BASE_DIR, fn), "r", encoding="utf-8") as f:
        c = f.read()
    cnt = len(re.findall(re.escape(kw), c, re.IGNORECASE))
    if cnt == 30:
        success_count += 1
    else:
        errors.append(f"{fn}: '{kw}' count is {cnt} (expected 30)")

# 60 Product pages
for p in products:
    title = p["title"]
    slug = p["slug"]
    with open(os.path.join(APP_DIR, f"{slug}.html"), "r", encoding="utf-8") as f:
        c = f.read()
    cnt = len(re.findall(re.escape(title), c, re.IGNORECASE))
    if cnt == 30:
        success_count += 1
    else:
        errors.append(f"app/{slug}.html: '{title}' count is {cnt} (expected 30)")

print(f"Keyword check completed: {71 - len([e for e in errors if 'count is' in e])}/71 passed.")

# 2. Check HTML Audits Across All 75 Files
print("\n--- CHECK 2: HTML SEO & AUDIT CHECKS ---")
for rel_path in all_files:
    full_path = os.path.join(BASE_DIR, rel_path.replace("/", os.sep))
    if not os.path.exists(full_path):
        errors.append(f"{rel_path}: File does not exist!")
        continue
    
    with open(full_path, "r", encoding="utf-8") as f:
        content = f.read()

    # H1 Check
    h1s = re.findall(r'<h1[^>]*>([\s\S]*?)</h1>', content)
    if len(h1s) != 1:
        errors.append(f"{rel_path}: Expected exactly 1 H1 tag, found {len(h1s)}")

    # H3 Check (must have > 1)
    h3s = re.findall(r'<h3[^>]*>([\s\S]*?)</h3>', content)
    if len(h3s) <= 1:
        errors.append(f"{rel_path}: Expected multiple H3 tags, found {len(h3s)}")

    # H2 Check for main pages (homepage, keyword pages, product pages should have 2 H2 tags)
    h2s = re.findall(r'<h2[^>]*>([\s\S]*?)</h2>', content)
    if rel_path == "index.html" or any(rel_path == fn for fn, _ in keyword_configs) or rel_path.startswith("app/"):
        if len(h2s) != 2:
            errors.append(f"{rel_path}: Expected exactly 2 H2 tags, found {len(h2s)}")

    # Image Alt Text Check
    imgs = re.findall(r'<img\s+[^>]*>', content)
    for img_tag in imgs:
        alt_m = re.search(r'alt="([^"]*)"', img_tag)
        if not alt_m or not alt_m.group(1).strip():
            errors.append(f"{rel_path}: Found img tag without descriptive alt: {img_tag}")

    # Meta Description Check (140-160 chars)
    desc_m = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', content)
    if not desc_m:
        errors.append(f"{rel_path}: Missing meta description!")
    else:
        desc_len = len(desc_m.group(1))
        if not (140 <= desc_len <= 160):
            errors.append(f"{rel_path}: Meta description length {desc_len} not in 140-160 chars ('{desc_m.group(1)}')")

    # Canonical URL Check
    canon_m = re.search(r'<link\s+rel="canonical"\s+href="([^"]*)"', content)
    if not canon_m:
        errors.append(f"{rel_path}: Missing canonical URL!")
    else:
        canon_url = canon_m.group(1)
        # Verify self-referential
        expected_url = f"https://plugineasy.com/{rel_path}" if rel_path != "index.html" else "https://plugineasy.com/"
        if canon_url != expected_url:
            errors.append(f"{rel_path}: Canonical URL is '{canon_url}', expected '{expected_url}'")

    # Title Check
    title_m = re.search(r'<title>([^<]*)</title>', content)
    if not title_m or len(title_m.group(1).strip()) < 10:
        errors.append(f"{rel_path}: Missing or too short title!")

    # JSON-LD Schema Check
    json_lds = re.findall(r'<script\s+type="application/ld\+json">([\s\S]*?)</script>', content)
    if len(json_lds) == 0:
        errors.append(f"{rel_path}: Missing JSON-LD structured data!")

    # Trust pages links in footer
    for tp in ["about.html", "contact.html", "privacy.html", "terms.html"]:
        if tp not in content:
            errors.append(f"{rel_path}: Missing link to trust page '{tp}' in content")

# 3. Check robots.txt and sitemap.xml
print("\n--- CHECK 3: ROBOTS.TXT & SITEMAP.XML & LLMS.TXT ---")
with open(os.path.join(BASE_DIR, "robots.txt"), "r", encoding="utf-8") as f:
    rb = f.read()
for crawler in ["GPTBot", "Google-Extended", "CCBot", "PerplexityBot", "Claude-User", "ChatGPT-User"]:
    if crawler not in rb:
        errors.append(f"robots.txt missing AI crawler rule for: {crawler}")
if "Sitemap: https://plugineasy.com/sitemap.xml" not in rb:
    errors.append("robots.txt missing sitemap declaration!")

with open(os.path.join(BASE_DIR, "sitemap.xml"), "r", encoding="utf-8") as f:
    sm = f.read()
locs = re.findall(r'<loc>([^<]*)</loc>', sm)
if len(locs) != len(all_files):
    errors.append(f"sitemap.xml has {len(locs)} URLs, expected {len(all_files)}")

with open(os.path.join(BASE_DIR, "llms.txt"), "r", encoding="utf-8") as f:
    ll = f.read()
for link in ["Homepage", "Sitemap", "About PluginEasy", "Contact Support", "Privacy Policy", "Terms of Service"]:
    if link not in ll:
        errors.append(f"llms.txt missing curated link: {link}")

# 4. Check Content Locker & APK
print("\n--- CHECK 4: CONTENT LOCKER & APK ASSETS ---")
with open(os.path.join(BASE_DIR, "js", "locker.js"), "r", encoding="utf-8") as f:
    lj = f.read()
if "831501" not in lj:
    errors.append("js/locker.js missing User ID 831501")
if "8902c82579eec05db438" not in lj:
    errors.append("js/locker.js missing Public API key 8902c82579eec05db438")
if "4a1d7b7a9f26dbe08fc3a0b059296411" not in lj:
    errors.append("js/locker.js missing Offers API key 4a1d7b7a9f26dbe08fc3a0b059296411")

apk_file = os.path.join(BASE_DIR, "downloads", "plugineasy.apk")
if not os.path.exists(apk_file) or os.path.getsize(apk_file) == 0:
    errors.append("downloads/plugineasy.apk missing or empty!")

print("\n==================================================")
print(f"   AUDIT SUMMARY: {len(errors)} ERRORS FOUND")
print("==================================================")

if errors:
    print("FAILED CHECKS:")
    for err in errors[:25]:
        print(f"  ❌ {err}")
    if len(errors) > 25:
        print(f"  ... and {len(errors) - 25} more errors.")
else:
    print("✅ ALL 75 PAGES PASSED 100% OF AUDIT CHECKS WITH PERFECT SCORES!")
