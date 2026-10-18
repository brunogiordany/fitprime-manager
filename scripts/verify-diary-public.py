"""Read-only production asset verification, without signing into any account."""
import json
import re
import time
import urllib.parse
import urllib.request

SITE = "https://fitprimehub-sfh8sqab.manus.space/"
HEADERS = {"Cache-Control": "no-cache", "User-Agent": "FitPrimeFocusAssetCheck/1.0"}


def read(url):
    request = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read().decode("utf-8", "replace")


def local_asset(url, extension):
    absolute = urllib.parse.urljoin(SITE, url)
    parsed = urllib.parse.urlparse(absolute)
    if parsed.netloc != urllib.parse.urlparse(SITE).netloc:
        return None
    if not parsed.path.endswith(extension) or "/assets/" not in parsed.path:
        return None
    return absolute


def verify():
    html = read(SITE + "?focus_asset_check=" + str(int(time.time())))
    scripts = [local_asset(src, ".js") for src in re.findall(r'<script[^>]+src=["\']([^"\']+)', html, re.I)]
    styles = [local_asset(src, ".css") for src in re.findall(r'<link[^>]+href=["\']([^"\']+)', html, re.I)]
    js_urls = sorted(set(filter(None, scripts)))
    css_urls = sorted(set(filter(None, styles)))
    if not js_urls or not css_urls:
        raise AssertionError("Production HTML did not reference local built JavaScript/CSS assets")
    javascript = "\n".join(read(url) for url in js_urls)
    css = "\n".join(read(url) for url in css_urls)
    for marker in ["data-diary-focus-lock", "data-diary-focus-layer", "--diary-keyboard-height"]:
        if marker not in javascript and marker not in css:
            raise AssertionError("Public assets missing focus fix marker: " + marker)
    if "data-diary-focus-lock" not in javascript:
        raise AssertionError("Public JavaScript is missing the document lock implementation")
    if "data-diary-focus-lock" not in css or "data-diary-focus-layer" not in css:
        raise AssertionError("Public CSS is missing the mobile isolation rules")
    versions = sorted(set(re.findall(r'checkpoint-screenshot\.png\?v=([0-9a-f]+)', html)))
    print(json.dumps({"result": "PUBLIC_FOCUS_ASSETS_CONFIRMED", "checkpoint_markers": versions, "javascript": js_urls, "stylesheets": css_urls}, indent=2))


last_error = None
for attempt in range(1, 9):
    try:
        verify()
        break
    except Exception as error:
        last_error = error
        print(f"Attempt {attempt}: {error}")
        if attempt < 8:
            time.sleep(8)
else:
    raise SystemExit("Could not confirm the focus fix in public assets: " + str(last_error))
