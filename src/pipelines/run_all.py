"""CLI entry-point that chains preprocessing → training → evaluation."""
from __future__ import annotations

import argparse
import json
from pathlib import Path

from . import config
from .evaluate import evaluate_yolo_model
from .preprocess import preprocess_dataset
from .train import train_yolo_model
from .utils import export_environment_snapshot, set_global_seed


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Run the full Driver Drowsiness Detection pipeline"
    )
    parser.add_argument(
        "--dataset-config",
        type=Path,
        default=None,
        help="Path ไปยังไฟล์ YAML ของ Ultralytics dataset (full mode เท่านั้น)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=config.DEFAULT_RANDOM_SEED,
        help="ค่า random seed ที่ต้องการใช้",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=50,
        help="จำนวน epochs สำหรับการเทรน (full mode)",
    )
    parser.add_argument(
        "--image-size",
        type=int,
        default=640,
        help="ขนาดภาพสำหรับการเทรน (full mode)",
    )
    parser.add_argument(
        "--demo",
        action="store_true",
        help="รัน pipeline แบบ demo (รวดเร็ว ใช้ assets ตัวอย่าง)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=config.PIPELINE_OUTPUT_DIR,
        help="โฟลเดอร์สำหรับเก็บผลลัพธ์ pipeline",
    )
    return parser


def run_pipeline(args: argparse.Namespace) -> dict[str, str | int | float | bool]:
    set_global_seed(args.seed)

    export_environment_snapshot(Path(args.output) / "environment.txt")

    processed = preprocess_dataset(demo=args.demo, seed=args.seed)

    if not args.demo and args.dataset_config is None:
        raise ValueError(
            "full pipeline ต้องระบุตำแหน่ง dataset YAML ผ่าน --dataset-config"
        )

    weights_path = train_yolo_model(
        dataset_config=None if args.demo else args.dataset_config,
        epochs=args.epochs,
        image_size=args.image_size,
        seed=args.seed,
        demo=args.demo,
    )

    eval_output = evaluate_yolo_model(
        weights_path=weights_path,
        images_dir=config.PROCESSED_DATA_DIR / "test",
        seed=args.seed,
        demo=args.demo,
    )

    summary = {
        "demo_mode": args.demo,
        "seed": args.seed,
        "weights_path": str(weights_path),
        "evaluation_report": str(eval_output),
        "preprocessed_counts": {split: len(files) for split, files in processed.items()},
    }

    json_summary = Path(args.output) / "pipeline_summary.json"
    json_summary.parent.mkdir(parents=True, exist_ok=True)
    json_summary.write_text(json.dumps(summary, indent=2, ensure_ascii=False))

    return summary


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    run_pipeline(args)


if __name__ == "__main__":
    main()
