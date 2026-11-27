import os
import re
import json
import html

BASE_DIR = r"c:\Users\m\Documents\plugineasy"
APP_DIR = os.path.join(BASE_DIR, "app")
SITE_URL = "https://plugineasy.comee.online"

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
    ("free-ios-plugins.html", "free ios plugins"),
    ("free-android-mods.html", "free android mods"),
    ("plugineasy-app-download.html", "plugineasy app download"),
    ("mobile-game-plugins.html", "mobile game plugins"),
    ("no-jailbreak-apps.html", "no jailbreak apps"),
    ("plugineasy-apk.html", "plugineasy apk"),
]

trust_pages = ["about.html", "contact.html", "privacy.html", "terms.html"]
all_files = ["index.html"] + [fn for fn, _ in keyword_configs] + trust_pages + [
    f"app/{p['slug']}.html" for p in products
]

def extract_visible_text(html_str):
    clean = re.sub(r'<(script|style)[^>]*>.*?</\1>', ' ', html_str, flags=re.S | re.I)
    text = re.sub(r'<[^>]+>', ' ', clean)
    return html.unescape(text)

print("==================================================")
print(f"   STARTING COMPREHENSIVE AUDIT OF ALL {len(all_files)} PAGES")
print("==================================================")

errors = []

# 1. Check 2% Keyword Density
print("\n--- CHECK 1: KEYWORD DENSITY (~2% OF TEXT) ---")
targets = [("index.html", "plugineasy")] + keyword_configs + [
    (f"app/{p['slug']}.html", p["title"]) for p in products
]

kw_passed = 0
for rel_path, kw in targets:
    full_path = os.path.join(BASE_DIR, rel_path.replace("/", os.sep))
    with open(full_path, "r", encoding="utf-8") as f:
        c = f.read()
    vis = extract_visible_text(c)
    total_w = len(vis.split())
    kw_words = max(1, len(kw.split()))
    cnt = len(re.findall(re.escape(kw), vis, re.IGNORECASE))
    density = (cnt * kw_words) / max(1, total_w) * 100.0
    if 1.5 <= density <= 4.5 and cnt >= 2:
        kw_passed += 1
    else:
        errors.append(f"{rel_path}: '{kw}' density {density:.2f}% (count={cnt}, words={total_w})")

print(f"Keyword density check completed: {kw_passed}/{len(targets)} passed.")

# 2. Check HTML Audits Across All Files
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

    # H3 Check
    h3s = re.findall(r'<h3[^>]*>([\s\S]*?)</h3>', content)
    if len(h3s) <= 1:
        errors.append(f"{rel_path}: Expected multiple H3 tags, found {len(h3s)}")

    # H2 Check
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
            errors.append(f"{rel_path}: Meta description length {desc_len} not in 140-160 chars")

    # Canonical URL Check
    canon_m = re.search(r'<link\s+rel="canonical"\s+href="([^"]*)"', content)
    if not canon_m:
        errors.append(f"{rel_path}: Missing canonical URL!")
    else:
        canon_url = canon_m.group(1)
        expected_url = f"{SITE_URL}/{rel_path}" if rel_path != "index.html" else f"{SITE_URL}/"
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
    else:
        for block in json_lds:
            try:
                json.loads(block)
            except Exception as e:
                errors.append(f"{rel_path}: Invalid JSON-LD syntax: {e}")

    # Trust pages links in footer
    for tp in trust_pages:
        if tp not in content:
            errors.append(f"{rel_path}: Missing link to trust page '{tp}' in content")

# 3. Check robots.txt, sitemap.xml, llms.txt
print("\n--- CHECK 3: ROBOTS.TXT & SITEMAP.XML & LLMS.TXT ---")
with open(os.path.join(BASE_DIR, "robots.txt"), "r", encoding="utf-8") as f:
    rb = f.read()
for crawler in ["GPTBot", "Google-Extended", "CCBot", "PerplexityBot", "Claude-User", "ChatGPT-User"]:
    if crawler not in rb:
        errors.append(f"robots.txt missing AI crawler rule for: {crawler}")
if f"Sitemap: {SITE_URL}/sitemap.xml" not in rb:
    errors.append("robots.txt missing live sitemap declaration!")

with open(os.path.join(BASE_DIR, "sitemap.xml"), "r", encoding="utf-8") as f:
    sm = f.read()
locs = re.findall(r'<loc>([^<]*)</loc>', sm)
if len(locs) != len(all_files):
    errors.append(f"sitemap.xml has {len(locs)} URLs, expected {len(all_files)}")

with open(os.path.join(BASE_DIR, "llms.txt"), "r", encoding="utf-8") as f:
    ll = f.read()
if SITE_URL not in ll:
    errors.append("llms.txt missing live domain URL!")

# 4. Check Content Locker & APK
print("\n--- CHECK 4: CONTENT LOCKER & APK ASSETS ---")
with open(os.path.join(BASE_DIR, "js", "locker.js"), "r", encoding="utf-8") as f:
    lj = f.read()
for key in ["831501", "8902c82579eec05db438", "4a1d7b7a9f26dbe08fc3a0b059296411"]:
    if key not in lj:
        errors.append(f"js/locker.js missing key {key}")

apk_file = os.path.join(BASE_DIR, "downloads", "plugineasy.apk")
if not os.path.exists(apk_file) or os.path.getsize(apk_file) == 0:
    errors.append("downloads/plugineasy.apk missing or empty!")

print("\n==================================================")
print(f"   AUDIT SUMMARY: {len(errors)} ERRORS FOUND")
print("==================================================")
if errors:
    for err in errors[:25]:
        print(f"  FAIL: {err}")
    if len(errors) > 25:
        print(f"  ... and {len(errors) - 25} more.")
    exit(1)
else:
    print(f"ALL {len(all_files)} PAGES PASSED 100% OF AUDIT CHECKS!")
