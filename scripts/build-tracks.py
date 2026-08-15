"""Regenerate *-tracks.js / *.json from YouTube playlist IDs in playlist-config.json."""
import json
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / "playlist-config.json"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"


def fetch_html(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=45) as r:
        return r.read().decode("utf-8", "replace")


def parse_yt_initial_data(html: str):
    marker = "var ytInitialData = "
    start = html.find(marker)
    if start < 0:
        return None
    start += len(marker)
    depth = 0
    for i in range(start, len(html)):
        ch = html[i]
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                try:
                    return json.loads(html[start : i + 1])
                except json.JSONDecodeError:
                    return None
    return None


def walk(obj):
    if isinstance(obj, dict):
        yield obj
        for v in obj.values():
            yield from walk(v)
    elif isinstance(obj, list):
        for v in obj:
            yield from walk(v)


def playlist_entries_from_html(html: str):
    data = parse_yt_initial_data(html)
    out = []
    seen = set()
    if data:
        for node in walk(data):
            if node.get("playlistVideoRenderer"):
                v = node["playlistVideoRenderer"]
                vid = v.get("videoId")
                if not vid or vid in seen:
                    continue
                title = vid
                runs = v.get("title", {}).get("runs") or []
                if runs:
                    title = runs[0].get("text", title)
                seen.add(vid)
                out.append((vid, title))
    if out:
        return out
    for vid in re.findall(r'"videoId":"([A-Za-z0-9_-]{11})"', html):
        if vid not in seen:
            seen.add(vid)
            out.append((vid, vid))
    return out


def oembed_meta(vid: str):
    url = "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=" + vid + "&format=json"
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            data = json.loads(r.read().decode())
        return {
            "id": vid,
            "title": data.get("title", vid),
            "artist": data.get("author_name", "YouTube"),
            "cover": data.get("thumbnail_url", "https://i.ytimg.com/vi/" + vid + "/hqdefault.jpg"),
        }
    except urllib.error.HTTPError:
        return None


def build_track(vid: str, fallback_title: str):
    meta = oembed_meta(vid)
    if meta:
        return meta
    return {
        "id": vid,
        "title": fallback_title,
        "artist": "YouTube",
        "cover": "https://i.ytimg.com/vi/" + vid + "/hqdefault.jpg",
    }


def build_playlist(pl_id: str):
    url = "https://www.youtube.com/playlist?list=" + pl_id
    html = fetch_html(url)
    entries = playlist_entries_from_html(html)
    tracks = []
    for vid, title in entries:
        tracks.append(build_track(vid, title))
        time.sleep(0.08)
    return tracks


def write_outputs(prefix: str, tracks):
    js_path = ROOT / (prefix + "-tracks.js")
    json_path = ROOT / (prefix + "-tracks.json")
    with js_path.open("w", encoding="utf-8") as f:
        f.write("window.MOOD_TRACKS = ")
        json.dump(tracks, f, ensure_ascii=False)
        f.write("\n")
    with json_path.open("w", encoding="utf-8") as f:
        json.dump(tracks, f, ensure_ascii=False, indent=2)
        f.write("\n")


def main():
    cfg = json.loads(CONFIG.read_text(encoding="utf-8-sig"))
    cache = {}
    for mood, pl_id in cfg["playlists"].items():
        if pl_id not in cache:
            print("Building playlist", pl_id)
            cache[pl_id] = build_playlist(pl_id)
            print("  count", len(cache[pl_id]))
        prefix = cfg["file_prefix"].get(mood, mood)
        write_outputs(prefix, cache[pl_id])
        print("Wrote", prefix + "-tracks.js")


if __name__ == "__main__":
    main()
