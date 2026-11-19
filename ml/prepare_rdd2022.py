#!/usr/bin/env python3
"""Convert labelled RDD2022 India Pascal-VOC annotations to YOLO format."""
from __future__ import annotations
import argparse, random, shutil, xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path

CLASSES = ["D00", "D10", "D20", "D40"]
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png"}

def find_pairs(root: Path):
    # Index images by basename because the archive stores images and XML in
    # separate sibling folders (e.g. JPEGImages/ and Annotations/).
    image_index = {}
    for p in root.rglob("*"):
        if p.is_file() and p.suffix.lower() in IMAGE_SUFFIXES:
            image_index.setdefault(p.stem.lower(), []).append(p)
    pairs, seen = [], set()
    for xml_path in root.rglob("*.xml"):
        try:
            tree = ET.parse(xml_path)
            filename = Path(tree.findtext("filename") or "").name
            candidates = ([root / filename] if filename else []) + image_index.get(xml_path.stem.lower(), [])
            if filename:
                candidates += image_index.get(Path(filename).stem.lower(), [])
            image_path = next((p for p in candidates if p and p.is_file()), None)
            if image_path and str(image_path.resolve()) not in seen:
                pairs.append((image_path, xml_path)); seen.add(str(image_path.resolve()))
        except (ET.ParseError, OSError):
            continue
    return pairs

def convert_annotation(xml_path: Path):
    root = ET.parse(xml_path).getroot()
    size = root.find("size")
    if size is None: raise ValueError(f"Missing image size in {xml_path}")
    width, height = int(size.findtext("width", "0")), int(size.findtext("height", "0"))
    if width <= 0 or height <= 0: raise ValueError(f"Invalid dimensions in {xml_path}")
    labels, counts = [], Counter()
    for obj in root.findall("object"):
        name = (obj.findtext("name") or "").strip().upper()
        if name not in CLASSES: continue
        box = obj.find("bndbox")
        if box is None: continue
        xmin, ymin = float(box.findtext("xmin", "0")), float(box.findtext("ymin", "0"))
        xmax, ymax = float(box.findtext("xmax", "0")), float(box.findtext("ymax", "0"))
        xmin, xmax = max(0, min(width, xmin)), max(0, min(width, xmax))
        ymin, ymax = max(0, min(height, ymin)), max(0, min(height, ymax))
        if xmax <= xmin or ymax <= ymin: continue
        xc, yc = ((xmin+xmax)/2)/width, ((ymin+ymax)/2)/height
        bw, bh = (xmax-xmin)/width, (ymax-ymin)/height
        labels.append(f"{CLASSES.index(name)} {xc:.7f} {yc:.7f} {bw:.7f} {bh:.7f}")
        counts[name] += 1
    return labels, counts

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, type=Path)
    ap.add_argument("--output", default=Path("datasets/rdd2022-india"), type=Path)
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    if not args.source.is_dir(): raise SystemExit(f"Source directory not found: {args.source}")
    pairs = find_pairs(args.source)
    if len(pairs) < 100: raise SystemExit(f"Only {len(pairs)} labelled image/XML pairs found; check --source and archive layout.")
    if args.output.exists():
        if not args.force: raise SystemExit(f"{args.output} exists. Pass --force to replace it.")
        shutil.rmtree(args.output)
    random.Random(args.seed).shuffle(pairs)
    n = len(pairs); n_train = int(n * .8); n_val = int(n * .1)
    splits = {"train": pairs[:n_train], "val": pairs[n_train:n_train+n_val], "test": pairs[n_train+n_val:]}
    total_counts = Counter()
    for split, items in splits.items():
        img_dir, label_dir = args.output / "images" / split, args.output / "labels" / split
        img_dir.mkdir(parents=True, exist_ok=True); label_dir.mkdir(parents=True, exist_ok=True)
        for image, xml in items:
            labels, counts = convert_annotation(xml)
            # JPEG encoding gives consistent extension/content for Ultralytics.
            try:
                from PIL import Image
                with Image.open(image) as im: im.convert("RGB").save(img_dir / (image.stem + ".jpg"), quality=95)
            except Exception as exc:
                raise RuntimeError(f"Could not convert image {image}: {exc}") from exc
            (label_dir / (image.stem + ".txt")).write_text("\n".join(labels) + ("\n" if labels else ""), encoding="utf-8")
            total_counts.update(counts)
        print(f"{split}: {len(items)} images")
    args.output.mkdir(parents=True, exist_ok=True)
    yaml = "path: " + str(args.output.resolve()) + "\ntrain: images/train\nval: images/val\ntest: images/test\nnames:\n"
    yaml += "".join(f"  {i}: {name}\n" for i, name in enumerate(CLASSES))
    (args.output / "data.yaml").write_text(yaml, encoding="utf-8")
    print("Class instances:", dict(total_counts))
    print("Dataset config:", args.output / "data.yaml")
    print("NOTE: held-out split is sampled from labelled training images; official challenge test labels are unavailable.")

if __name__ == "__main__": main()
