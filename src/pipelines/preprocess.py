"""Dataset preparation utilities for the drowsiness detection pipeline."""
from __future__ import annotations

import shutil
from pathlib import Path
from typing import Iterable

from . import config
from .utils import copy_images, ensure_directory, set_global_seed

SUPPORTED_IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp"}


def _discover_images(folder: Path) -> list[Path]:
    if not folder.exists():
        return []
    return [
        path
        for path in folder.rglob("*")
        if path.is_file() and path.suffix.lower() in SUPPORTED_IMAGE_SUFFIXES
    ]


def preprocess_dataset(
    *,
    raw_dir: Path | None = None,
    output_dir: Path | None = None,
    seed: int = config.DEFAULT_RANDOM_SEED,
    demo: bool = False,
) -> dict[str, Iterable[Path]]:
    """Prepare a deterministic dataset split ready for training.

    Returns a mapping that lists the files placed in each subset.
    """

    set_global_seed(seed)

    raw_dir = raw_dir or config.RAW_DATA_DIR
    output_dir = output_dir or config.PROCESSED_DATA_DIR
    ensure_directory(output_dir)

    if demo:
        source_dir = config.DEMO_SOURCE_DIR
        if not source_dir.exists():
            raise FileNotFoundError(
                f"Demo image directory not found: {source_dir}. Clone tests assets first."
            )
        images = _discover_images(source_dir)
    else:
        images = _discover_images(raw_dir)

    if not images:
        raise FileNotFoundError(
            "ไม่พบไฟล์ภาพสำหรับ preprocessing — โปรดตรวจสอบ data/raw หรือใช้โหมด demo"
        )

    # Simple deterministic split: 80/20 train/val, rest test (mirrors small dataset behaviour).
    split_index = int(len(images) * 0.8)
    train_images = images[:split_index]
    val_images = images[split_index:]

    processed_train = ensure_directory(output_dir / "train")
    processed_val = ensure_directory(output_dir / "val")

    copied = {
        "train": copy_images(train_images, processed_train),
        "val": copy_images(val_images, processed_val),
    }

    # Refresh test folder with a pristine copy for evaluation convenience.
    test_folder = output_dir / "test"
    if test_folder.exists():
        shutil.rmtree(test_folder)
    copied["test"] = copy_images(images, ensure_directory(test_folder))

    return copied
