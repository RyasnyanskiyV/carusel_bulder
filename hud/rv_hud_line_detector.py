#!/usr/bin/env python3
"""
RV HUD Line Detector

Detects clean horizontal and vertical HUD-like line segments from a reference
image. The companion JSX script uses the JSON output to rebuild the design in
After Effects as lightweight shape strokes instead of heavy pixel-vector blobs.

Dependencies: Pillow and NumPy.
"""

from __future__ import annotations

import argparse
import json
import math
import os
import sys
from collections import deque
from typing import List, Sequence, Tuple

import numpy as np
from PIL import Image


Color = Tuple[float, float, float]


def clamp(value: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, value))


def luma(rgb: Sequence[float]) -> float:
    return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722


def fit_image_to_canvas(path: str, width: int, height: int) -> Image.Image:
    src = Image.open(path).convert("RGBA")
    src_arr = np.asarray(src, dtype=np.uint8)
    h, w, _ = src_arr.shape
    corner_rgb = np.array(
        [
            src_arr[0, 0, :3],
            src_arr[0, w - 1, :3],
            src_arr[h - 1, 0, :3],
            src_arr[h - 1, w - 1, :3],
        ],
        dtype=np.float32,
    ).mean(axis=0)
    bg = tuple(int(v + 0.5) for v in corner_rgb.tolist()) + (255,)
    scale = min(width / src.width, height / src.height)
    new_w = max(1, int(round(src.width * scale)))
    new_h = max(1, int(round(src.height * scale)))
    resized = src.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas = Image.new("RGBA", (width, height), bg)
    canvas.alpha_composite(resized, ((width - new_w) // 2, (height - new_h) // 2))
    return canvas


def corner_background(arr: np.ndarray) -> Tuple[np.ndarray, float]:
    h, w, _ = arr.shape
    samples = np.array(
        [arr[0, 0], arr[0, w - 1], arr[h - 1, 0], arr[h - 1, w - 1]],
        dtype=np.float32,
    )
    return samples[:, :3].mean(axis=0) / 255.0, float(samples[:, 3].mean() / 255.0)


def make_foreground_mask(
    arr: np.ndarray,
    threshold: float,
    alpha_threshold: float,
) -> Tuple[np.ndarray, Color, Color]:
    rgb = arr[:, :, :3].astype(np.float32) / 255.0
    alpha = arr[:, :, 3].astype(np.float32) / 255.0
    bg_rgb, bg_alpha = corner_background(arr)

    if bg_alpha < alpha_threshold:
        mask = alpha > alpha_threshold
    else:
        bg_luma = luma(bg_rgb)
        lum = rgb[:, :, 0] * 0.2126 + rgb[:, :, 1] * 0.7152 + rgb[:, :, 2] * 0.0722
        lum_delta = np.abs(lum - bg_luma)
        color_delta = np.sqrt(np.sum((rgb - bg_rgb.reshape((1, 1, 3))) ** 2, axis=2))
        mask = (alpha > alpha_threshold) & (
            (lum_delta >= threshold) | (color_delta >= threshold * 1.35)
        )

    if np.any(mask):
        fg = rgb[mask].mean(axis=0)
    else:
        fg = np.array([1.0, 1.0, 1.0], dtype=np.float32)
    return mask, (float(fg[0]), float(fg[1]), float(fg[2])), (
        float(bg_rgb[0]),
        float(bg_rgb[1]),
        float(bg_rgb[2]),
    )


def mark_horizontal_runs(mask: np.ndarray, min_length: int) -> np.ndarray:
    h, w = mask.shape
    out = np.zeros_like(mask, dtype=bool)
    for y in range(h):
        row = mask[y]
        x = 0
        while x < w:
            while x < w and not row[x]:
                x += 1
            start = x
            while x < w and row[x]:
                x += 1
            if x - start >= min_length:
                out[y, start:x] = True
    return out


def mark_vertical_runs(mask: np.ndarray, min_length: int) -> np.ndarray:
    h, w = mask.shape
    out = np.zeros_like(mask, dtype=bool)
    for x in range(w):
        col = mask[:, x]
        y = 0
        while y < h:
            while y < h and not col[y]:
                y += 1
            start = y
            while y < h and col[y]:
                y += 1
            if y - start >= min_length:
                out[start:y, x] = True
    return out


def connected_components(mask: np.ndarray):
    h, w = mask.shape
    visited = np.zeros_like(mask, dtype=bool)
    ys, xs = np.nonzero(mask)

    for seed_y, seed_x in zip(ys.tolist(), xs.tolist()):
        if visited[seed_y, seed_x]:
            continue
        queue = deque([(seed_y, seed_x)])
        visited[seed_y, seed_x] = True
        min_x = max_x = seed_x
        min_y = max_y = seed_y
        count = 0

        while queue:
            y, x = queue.popleft()
            count += 1
            if x < min_x:
                min_x = x
            if x > max_x:
                max_x = x
            if y < min_y:
                min_y = y
            if y > max_y:
                max_y = y

            for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not visited[ny, nx]:
                    visited[ny, nx] = True
                    queue.append((ny, nx))

        yield min_x, min_y, max_x, max_y, count


def merge_similar_lines(lines: List[dict], orientation: str, merge_gap: float) -> List[dict]:
    if not lines:
        return []

    if orientation == "h":
        lines.sort(key=lambda item: (round(item["y1"] / max(1, merge_gap)), item["x1"]))
    else:
        lines.sort(key=lambda item: (round(item["x1"] / max(1, merge_gap)), item["y1"]))

    merged: List[dict] = []
    for line in lines:
        if not merged:
            merged.append(line)
            continue
        last = merged[-1]
        if orientation == "h":
            close_axis = abs(last["y1"] - line["y1"]) <= merge_gap
            overlap = line["x1"] <= last["x2"] + merge_gap
            if close_axis and overlap:
                last["x1"] = min(last["x1"], line["x1"])
                last["x2"] = max(last["x2"], line["x2"])
                last["width"] = max(last["width"], line["width"])
                last["confidence"] = max(last["confidence"], line["confidence"])
                continue
        else:
            close_axis = abs(last["x1"] - line["x1"]) <= merge_gap
            overlap = line["y1"] <= last["y2"] + merge_gap
            if close_axis and overlap:
                last["y1"] = min(last["y1"], line["y1"])
                last["y2"] = max(last["y2"], line["y2"])
                last["width"] = max(last["width"], line["width"])
                last["confidence"] = max(last["confidence"], line["confidence"])
                continue
        merged.append(line)
    return merged


def detect_lines(
    mask: np.ndarray,
    min_length: int,
    min_ratio: float,
    merge_gap: float,
    max_lines: int,
) -> List[dict]:
    lines: List[dict] = []

    hmask = mark_horizontal_runs(mask, min_length)
    for min_x, min_y, max_x, max_y, count in connected_components(hmask):
        width = max_x - min_x + 1
        height = max_y - min_y + 1
        if width < min_length or width < height * min_ratio:
            continue
        y = (min_y + max_y + 1) * 0.5
        lines.append(
            {
                "orientation": "h",
                "x1": float(min_x),
                "y1": float(y),
                "x2": float(max_x + 1),
                "y2": float(y),
                "width": float(max(1, height)),
                "confidence": float(count) / max(1.0, width * height),
            }
        )

    vmask = mark_vertical_runs(mask, min_length)
    for min_x, min_y, max_x, max_y, count in connected_components(vmask):
        width = max_x - min_x + 1
        height = max_y - min_y + 1
        if height < min_length or height < width * min_ratio:
            continue
        x = (min_x + max_x + 1) * 0.5
        lines.append(
            {
                "orientation": "v",
                "x1": float(x),
                "y1": float(min_y),
                "x2": float(x),
                "y2": float(max_y + 1),
                "width": float(max(1, width)),
                "confidence": float(count) / max(1.0, width * height),
            }
        )

    h_lines = merge_similar_lines(
        [line for line in lines if line["orientation"] == "h"],
        "h",
        merge_gap,
    )
    v_lines = merge_similar_lines(
        [line for line in lines if line["orientation"] == "v"],
        "v",
        merge_gap,
    )
    result = h_lines + v_lines
    result.sort(
        key=lambda item: (
            item["orientation"],
            item["y1"] if item["orientation"] == "h" else item["x1"],
            item["x1"] if item["orientation"] == "h" else item["y1"],
        )
    )
    return result[:max_lines]


def parse_args(argv: Sequence[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Detect HUD line segments from an image.")
    parser.add_argument("--input", required=True)
    parser.add_argument("--json", required=True)
    parser.add_argument("--width", type=int, default=3840)
    parser.add_argument("--height", type=int, default=2160)
    parser.add_argument("--threshold", type=float, default=0.055)
    parser.add_argument("--alpha-threshold", type=float, default=0.03)
    parser.add_argument("--min-length", type=int, default=42)
    parser.add_argument("--min-ratio", type=float, default=3.5)
    parser.add_argument("--merge-gap", type=float, default=8)
    parser.add_argument("--max-lines", type=int, default=1200)
    args = parser.parse_args(argv)

    args.width = int(clamp(args.width, 64, 12000))
    args.height = int(clamp(args.height, 64, 12000))
    args.threshold = clamp(args.threshold, 0, 1)
    args.alpha_threshold = clamp(args.alpha_threshold, 0, 1)
    args.min_length = int(clamp(args.min_length, 1, 10000))
    args.min_ratio = clamp(args.min_ratio, 1, 100)
    args.merge_gap = clamp(args.merge_gap, 0, 1000)
    args.max_lines = int(clamp(args.max_lines, 1, 200000))
    return args


def main(argv: Sequence[str]) -> int:
    args = parse_args(argv)
    img = fit_image_to_canvas(args.input, args.width, args.height)
    arr = np.asarray(img, dtype=np.uint8)
    mask, fg_color, bg_color = make_foreground_mask(arr, args.threshold, args.alpha_threshold)
    lines = detect_lines(mask, args.min_length, args.min_ratio, args.merge_gap, args.max_lines)

    data = {
        "width": args.width,
        "height": args.height,
        "duration": 10,
        "fps": 30,
        "background": list(bg_color),
        "suggestedLineColor": list(fg_color),
        "lines": lines,
        "stats": {
            "foregroundPixels": int(mask.sum()),
            "lineCount": len(lines),
            "maxLinesReached": len(lines) >= args.max_lines,
        },
    }

    os.makedirs(os.path.dirname(os.path.abspath(args.json)), exist_ok=True)
    with open(args.json, "w", encoding="utf-8") as fh:
        json.dump(data, fh, ensure_ascii=False, separators=(",", ":"))

    print("RV_HUD_LINES_OK")
    print("JSON=" + os.path.abspath(args.json))
    print("LINES={}".format(len(lines)))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main(sys.argv[1:]))
    except Exception as exc:
        print("RV_HUD_LINES_ERROR: {}".format(exc), file=sys.stderr)
        raise
