"""Utility helpers supporting the ML pipeline."""
from __future__ import annotations

import os
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Optional

import numpy as np

try:
    import torch
except ImportError:  # pragma: no cover - torch is optional in some environments
    torch = None  # type: ignore


@dataclass
class SeedState:
    """Snapshot of the RNG state for reproducibility reports."""

    python_state: tuple
    numpy_state: tuple
    torch_state: Optional[tuple]


def set_global_seed(seed: int) -> SeedState:
    """Seed every known RNG so repeated runs stay deterministic."""

    random.seed(seed)
    np.random.seed(seed)

    python_state = random.getstate()
    numpy_state = np.random.get_state()

    torch_state = None
    if torch is not None:
        torch.manual_seed(seed)
        torch.cuda.manual_seed_all(seed)
        torch.backends.cudnn.deterministic = True
        torch.backends.cudnn.benchmark = False
        torch_state = torch.get_rng_state()

    return SeedState(
        python_state=python_state, numpy_state=numpy_state, torch_state=torch_state
    )


def ensure_directory(path: Path) -> Path:
    """Create a directory (and parents) if it does not already exist."""

    path.mkdir(parents=True, exist_ok=True)
    return path


def copy_images(image_paths: Iterable[Path], destination: Path) -> list[Path]:
    """Copy a collection of images into the destination folder."""

    ensure_directory(destination)
    written: list[Path] = []
    for source in image_paths:
        target = destination / source.name
        target.write_bytes(source.read_bytes())
        written.append(target)
    return written


def export_environment_snapshot(output_path: Path) -> None:
    """Persist a deterministic summary of the environment variables."""

    ensure_directory(output_path.parent)
    environment_dump = "\n".join(f"{k}={v}" for k, v in sorted(os.environ.items()))
    output_path.write_text(environment_dump)
