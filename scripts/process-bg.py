"""Process mood wallpapers into cinematic dual-layer assets (truck-wala style)."""

from __future__ import annotations

import os
from pathlib import Path

from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
IMAGES = ROOT / "images"

MOODS = [
    ("delux-saloon.jpg", "delux-saloon"),
    ("auto.jpg", "auto"),
    ("baarish.jpg", "baarish"),
    ("roof.jpg", "roof"),
    ("mood-suite.jpg", "mood-suite"),
]

TARGET_W = 1920
TARGET_H = 1080
QUALITY_JPG = 82
QUALITY_WEBP = 78


def cover_crop(img: Image.Image, target_w: int, target_h: int, focus_y: float) -> Image.Image:
    """Crop to cover aspect ratio with vertical focus (0=top, 1=bottom)."""
    src_w, src_h = img.size
    target_ratio = target_w / target_h
    src_ratio = src_w / src_h

    if src_ratio > target_ratio:
        new_h = src_h
        new_w = int(src_h * target_ratio)
    else:
        new_w = src_w
        new_h = int(src_w / target_ratio)

    left = (src_w - new_w) // 2
    top = int((src_h - new_h) * focus_y)
    top = max(0, min(top, src_h - new_h))
    cropped = img.crop((left, top, left + new_w, top + new_h))
    return cropped.resize((target_w, target_h), Image.Resampling.LANCZOS)


def vignette(img: Image.Image, strength: float = 0.55) -> Image.Image:
    w, h = img.size
    mask = Image.new("L", (w, h), 0)
    px = mask.load()
    cx, cy = w / 2, h / 2
    max_dist = (cx**2 + cy**2) ** 0.5
    for y in range(h):
        for x in range(w):
            dist = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            t = min(1.0, dist / max_dist)
            px[x, y] = int(255 * (1 - strength * (t**1.6)))
    return Image.composite(img, Image.new("RGB", img.size, (0, 0, 0)), mask)


def cinematic_grade(img: Image.Image, variant: int) -> Image.Image:
    img = ImageEnhance.Brightness(img).enhance(0.42 if variant == 1 else 0.48)
    img = ImageEnhance.Contrast(img).enhance(1.35)
    img = ImageEnhance.Color(img).enhance(0.55 if variant == 1 else 0.62)
    img = img.filter(ImageFilter.GaussianBlur(radius=0.6))
    return vignette(img, strength=0.62 if variant == 1 else 0.5)


def process_source(src_name: str, prefix: str) -> None:
    src = IMAGES / src_name
    if not src.exists():
        print(f"skip missing {src}")
        return

    base = Image.open(src).convert("RGB")
    variants = [
        (1, 0.42),
        (2, 0.28),
    ]

    for num, focus_y in variants:
        cropped = cover_crop(base, TARGET_W, TARGET_H, focus_y)
        graded = cinematic_grade(cropped, num)
        jpg_path = IMAGES / f"{prefix}-bg-{num}.jpg"
        webp_path = IMAGES / f"{prefix}-bg-{num}.webp"
        graded.save(jpg_path, "JPEG", quality=QUALITY_JPG, optimize=True)
        graded.save(webp_path, "WEBP", quality=QUALITY_WEBP, method=6)
        print(f"wrote {jpg_path.name} ({jpg_path.stat().st_size // 1024}KB)")
        print(f"wrote {webp_path.name} ({webp_path.stat().st_size // 1024}KB)")


def main() -> None:
    for src_name, prefix in MOODS:
        process_source(src_name, prefix)


if __name__ == "__main__":
    main()
