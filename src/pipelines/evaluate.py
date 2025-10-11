"""Evaluation helpers for the driver drowsiness detection models."""
from __future__ import annotations

import json
from collections import Counter
from pathlib import Path
from statistics import mean

from . import config
from .utils import ensure_directory, set_global_seed

try:
    from ultralytics import YOLO
except ImportError as exc:  # pragma: no cover
    raise ImportError(
        "Ultralytics YOLO not installed. ติดตั้งด้วย pip install ultralytics"
    ) from exc


def evaluate_yolo_model(
    *,
    weights_path: Path,
    images_dir: Path,
    seed: int = config.DEFAULT_RANDOM_SEED,
    output_dir: Path | None = None,
    demo: bool = False,
) -> Path:
    """Run inference on the supplied images and persist a JSON summary."""

    set_global_seed(seed)

    if not weights_path.exists():
        raise FileNotFoundError(f"ไม่พบไฟล์ weights ที่ {weights_path}")

    image_files = sorted(
        [p for p in images_dir.glob("**/*") if p.suffix.lower() in {".jpg", ".png"}]
    )
    if not image_files:
        raise FileNotFoundError(
            f"ไม่พบไฟล์ภาพสำหรับ evaluation ใน {images_dir}. รัน preprocessing ก่อน"
        )

    model = YOLO(str(weights_path))

    per_image_results: list[dict[str, float | str | int]] = []
    confidence_scores: list[float] = []
    detections = Counter()

    for image_path in image_files:
        results = model(image_path, verbose=demo is False)
        if not results:
            continue
        result = results[0]
        boxes = result.boxes
        names = result.names
        if boxes is None or len(boxes) == 0:
            continue

        conf = float(boxes.conf[0])
        cls_id = int(boxes.cls[0])
        cls_name = names.get(cls_id, str(cls_id))

        confidence_scores.append(conf)
        detections[cls_name] += 1

        per_image_results.append(
            {
                "image": str(image_path.relative_to(images_dir)),
                "confidence": conf,
                "class_id": cls_id,
                "class_name": cls_name,
            }
        )

    summary = {
        "weights_path": str(weights_path),
        "num_images": len(image_files),
        "num_detections": int(sum(detections.values())),
        "detections": dict(detections),
        "average_confidence": mean(confidence_scores) if confidence_scores else 0.0,
        "per_image": per_image_results,
        "seed": seed,
        "demo_mode": demo,
    }

    output_dir = ensure_directory(output_dir or config.EVALUATIONS_DIR)
    output_path = output_dir / (
        config.DEMO_EVAL_FILENAME if demo else "evaluation_results.json"
    )
    output_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False))
    return output_path
