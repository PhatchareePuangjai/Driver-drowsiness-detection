"""Training helpers for the Driver Drowsiness Detection project."""
from __future__ import annotations

import shutil
from pathlib import Path

from . import config
from .utils import ensure_directory, set_global_seed

try:
    from ultralytics import YOLO
except ImportError as exc:  # pragma: no cover - handled via README instructions
    raise ImportError(
        "Ultralytics YOLO not installed. ติดตั้งด้วย pip install ultralytics"
    ) from exc


def train_yolo_model(
    *,
    dataset_config: Path | None,
    epochs: int = 50,
    image_size: int = 640,
    seed: int = config.DEFAULT_RANDOM_SEED,
    output_dir: Path | None = None,
    demo: bool = False,
) -> Path:
    """Fine-tune the YOLO model using the supplied dataset YAML.

    When ``demo`` is True the function skips the heavy fine-tuning step and simply
    copies the existing checkpoint so the downstream evaluation stage can proceed
    quickly. This keeps the pipeline reproducible on laptops without a GPU.
    """

    set_global_seed(seed)

    output_dir = ensure_directory(output_dir or config.WEIGHTS_DIR)

    if demo:
        source_weight = config.WEIGHTS_DIR / "yolo.pt"
        if not source_weight.exists():
            raise FileNotFoundError(
                f"ไม่พบไฟล์ weights หลักที่ {source_weight} — ดาวน์โหลดโมเดลก่อน"
            )
        demo_weight = output_dir / "yolo_demo.pt"
        shutil.copy2(source_weight, demo_weight)
        return demo_weight

    if dataset_config is None:
        raise ValueError("ต้องระบุ dataset_config เมื่อรันแบบ full training")

    yolo_model = YOLO(str(config.WEIGHTS_DIR / "yolo.pt"))
    results = yolo_model.train(
        data=str(dataset_config), epochs=epochs, imgsz=image_size, seed=seed
    )

    # Ultralytics stores the best checkpoint inside runs/detect/train*
    best_weight = Path(results.save_dir) / "weights" / "best.pt"
    final_destination = output_dir / "yolo_finetuned.pt"
    if best_weight.exists():
        shutil.copy2(best_weight, final_destination)
    else:
        raise FileNotFoundError(
            f"Ultralytics training output ไม่พบไฟล์ weights ที่ {best_weight}"
        )

    return final_destination
