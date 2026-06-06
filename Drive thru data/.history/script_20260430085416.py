"""
Drive Thru Eats - Web Scraper
Website : https://drive-thrueats.online/
Output  : menu_data.json  aur  menu_data.csv

Usage:
    pip install requests beautifulsoup4
    python scrape_drive_thrueats.py
"""

import requests
from bs4 import BeautifulSoup
import json
import csv
import time
from collections import defaultdict

# ──────────────────────────────────────────────
URL = "https://drive-thrueats.online/"
BASE_URL = "https://drive-thrueats.online"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Cache-Control": "max-age=0",
}

CATEGORIES = [
    "BREAKFAST", "SHAWARMA", "TANDOORI CHICKEN", "PIZZA", "BURGER",
    "ROLLS", "CHICKEN MEALS", "MOMOS", "SANDWICH", "OTHER COURSE",
    "COMBOS", "KIDS MENU", "APPETIZERS", "SALAD'S", "JUICES",
    "SHAKES", "ICE CREAM / SWEETS", "WATER",
]
CAT_SET = {c.upper() for c in CATEGORIES}


def fetch_page(url: str, retries: int = 3) -> BeautifulSoup:
    """Page fetch karo, retry logic ke saath."""
    session = requests.Session()
    session.headers.update(HEADERS)

    for attempt in range(1, retries + 1):
        try:
            print(f"  Attempt {attempt}: {url}")
            resp = session.get(url, timeout=20)
            resp.raise_for_status()
            return BeautifulSoup(resp.text, "html.parser")
        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 403:
                print(f"  403 Forbidden - {attempt}. wait kar raha hoon...")
                time.sleep(3)
            else:
                raise
        except requests.exceptions.ConnectionError:
            print(f"  Connection error - retry {attempt}...")
            time.sleep(2)

    raise RuntimeError(
        "Page fetch nahi hua.\n"
        "Solution: Browser se manually HTML save karke:\n"
        "  soup = BeautifulSoup(open('page.html', encoding='utf-8'), 'html.parser')"
    )


def _find_price(h5_tag) -> str:
    """h5 ke parent/grandparent mein price (rupee sign) dhundo."""
    for ancestor in [h5_tag.parent, h5_tag.parent.parent if h5_tag.parent else None]:
        if ancestor is None:
            continue
        for node in ancestor.descendants:
            text = getattr(node, "string", None) or ""
            text = text.strip()
            if "\u20b9" in text and len(text) < 25:
                return text.replace("\u20b9", "").strip()
    return "N/A"


def parse_menu(soup: BeautifulSoup) -> list:
    """
    Menu items parse karo HTML se.
    Pattern:
        <h5> without img  →  category heading
        <h5> with img     →  menu item
    """
    menu = []
    current_cat = "Unknown"

    for h5 in soup.find_all("h5"):
        img = h5.find("img")

        # Category heading
        if not img:
            text = h5.get_text(strip=True).upper()
            if text in CAT_SET:
                current_cat = text
            continue

        # Menu item
        item_name = img.get("alt", "").strip()
        image_url = img.get("src", "").strip()

        if not item_name:
            continue

        if image_url and not image_url.startswith("http"):
            image_url = BASE_URL + "/" + image_url.lstrip("/")

        price = _find_price(h5)

        menu.append({
            "category": current_cat,
            "name": item_name,
            "restaurant": "Burger Arena",
            "price_INR": price,
            "image_url": image_url,
        })

    return menu


def save_json(data: list, filename: str = "menu_data.json"):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"JSON saved  -> {filename}")


def save_csv(data: list, filename: str = "menu_data.csv"):
    if not data:
        return
    keys = ["category", "name", "restaurant", "price_INR", "image_url"]
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(data)
    print(f"CSV saved   -> {filename}")


def print_summary(data: list):
    cat_counts = defaultdict(int)
    for item in data:
        cat_counts[item["category"]] += 1

    print("\n" + "=" * 52)
    print("  MENU SUMMARY - Drive Thru Eats")
    print("=" * 52)
    for cat in CATEGORIES:
        count = cat_counts.get(cat, 0)
        if count:
            print(f"  {cat:<28} {count:>3} items")
    unknown = cat_counts.get("Unknown", 0)
    if unknown:
        print(f"  {'Unknown':<28} {unknown:>3} items")
    print(f"\n  TOTAL ITEMS: {len(data)}")
    print("=" * 52)

    print("\nSample (pehle 5 items):")
    for item in data[:5]:
        print(f"  [{item['category']}] {item['name']} - Rs.{item['price_INR']}")


def main():
    print("Drive Thru Eats Scraper shuru ho raha hai...")
    print(f"URL: {URL}\n")

    soup = fetch_page(URL)

    print("Menu data extract ho raha hai...")
    menu = parse_menu(soup)

    if not menu:
        print("Koi item nahi mila. HTML structure change ho gaya hoga.")
        return

    print_summary(menu)
    print()
    save_json(menu)
    save_csv(menu)
    print("\nScraping complete!")


if __name__ == "__main__":
    main()