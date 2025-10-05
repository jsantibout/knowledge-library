import os, csv, json, time, re, glob, hashlib
from pathlib import Path
from urllib.parse import urlparse
import requests
from bs4 import BeautifulSoup

DATA_DIR = Path("data")
OUT_PATH = DATA_DIR / "harvested.jsonl"
CSV_GLOB = "data/*.csv"  # put all NASA CSVs here

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; SpaceBioHarvester/1.0)"}
SECTION_KEYS = ["abstract", "introduction", "methods", "results", "discussion", "conclusion"]


def clean_text(html: str) -> dict:
    """Extract text by sections (PMC pages usually have h2/h3 for sections)."""
    soup = BeautifulSoup(html, "lxml")
    for tag in soup(["script","style","noscript","header","footer","nav","aside"]):
        tag.decompose()

    sections = {}
    current = "fulltext"
    buf = []

    def flush():
        txt = "\n".join(buf).strip()
        if txt:
            sections.setdefault(current, "")
            sections[current] += ("\n\n" + txt if sections[current] else txt)

    # Walk headings/paragraphs and group under nearest heading
    for node in soup.find_all(["h1","h2","h3","p","div","section"]):
        t = node.name.lower()
        if t in ["h1","h2","h3"]:
            flush()
            title = re.sub(r"\s+", " ", node.get_text(" ", strip=True)).lower()
            mapped = next((k for k in SECTION_KEYS if k in title), None)
            current = mapped or title or "section"
            buf = []
        else:
            text = node.get_text(" ", strip=True)
            if text and len(text) > 1:
                buf.append(text)
    flush()

    # Keep canonical sections first, then any substantial leftovers
    if sections:
        ordered = {}
        for k in SECTION_KEYS:
            if k in sections and len(sections[k]) >= 400:
                ordered[k] = sections[k]
        for k, v in sections.items():
            if k not in ordered and len(v) >= 400:
                ordered[k] = v
        return ordered

    # Fallback: one big block
    txt = soup.get_text(separator="\n")
    txt = re.sub(r"\n{3,}", "\n\n", txt)
    txt = re.sub(r"[ \t]{2,}", " ", txt)
    return {"fulltext": txt.strip()}

def fetch(url: str, timeout=25):
    try:
        r = requests.get(url, headers=HEADERS, timeout=timeout)
        r.raise_for_status()
        return r.text
    except Exception as e:
        print(f"❌ {url} -> {e}")
        return None

def read_rows(csv_path: Path):
    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        cols = {c.lower(): c for c in reader.fieldnames or []}
        title_col = cols.get("title") or cols.get("name") or list(cols.values())[0]
        link_col = cols.get("link") or cols.get("url") or list(cols.values())[1]
        for row in reader:
            title = (row.get(title_col) or "").strip()
            link  = (row.get(link_col) or "").strip()
            if title and link:
                yield title, link

def url_key(u: str, section: str) -> str:
    # stable dedupe key (normalize scheme + path; ignore query)
    p = urlparse(u.strip())
    base = f"{p.netloc}{p.path}".lower()
    return hashlib.sha1(f"{base}::{section.lower()}".encode("utf-8")).hexdigest()

def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    # Load existing to avoid duplicates on reruns
    seen = set()
    if OUT_PATH.exists():
        with open(OUT_PATH, encoding="utf-8") as f:
            for line in f:
                if not line.strip(): continue
                try:
                    rec = json.loads(line)
                    seen.add(url_key(rec.get("url",""), rec.get("section", "fulltext")))
                except: 
                    pass

    total_new = 0
    with open(OUT_PATH, "a", encoding="utf-8") as out:
        for csv_file in glob.glob(CSV_GLOB):
            print(f"📄 Reading {csv_file}")
            for title, url in read_rows(Path(csv_file)):
                html = fetch(url)
                if not html:
                    continue
                secmap = clean_text(html)

                wrote_any = False

                for section, text in secmap.items():
                    if len(text) < 500:
                        continue
                    
                    k = url_key(url, section)
                    if k in seen:
                        continue
                    
                    rec = {
                        "id": f"{url}::{section}",
                        "title": title,
                        "url": url,
                        "section": section,
                        "source_type": "web",
                        "text": text
                    }
                    out.write(json.dumps(rec, ensure_ascii=False) + "\n")
                    seen.add(k)
                    total_new += 1
                    wrote_any = True

                if wrote_any:
                    print(f"✅ {title[:70]}… (+{len(secmap)})")
                else:
                    print(f"⚠️ No substantial sections kept: {title[:70]}…")


                time.sleep(0.4)  
    print(f"\nDone. Added {total_new} new records → {OUT_PATH}")

if __name__ == "__main__":
    main()
