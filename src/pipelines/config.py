"""Configuration values shared across the training pipeline."""
from __future__ import annotations

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATA_DIR = PROJECT_ROOT / "data"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
RAW_DATA_DIR = DATA_DIR / "raw"
MODELS_DIR = PROJECT_ROOT / "models"
WEIGHTS_DIR = MODELS_DIR / "weights"
EVALUATIONS_DIR = MODELS_DIR / "evaluations"
OUTPUTS_DIR = PROJECT_ROOT / "outputs"
PIPELINE_OUTPUT_DIR = OUTPUTS_DIR / "pipeline"
DEFAULT_RANDOM_SEED = 42

# Demo settings keep inference quick while still exercising the stack.
DEMO_IMAGE_GLOB = "*.jpg"
DEMO_SOURCE_DIR = PROJECT_ROOT / "src" / "backend" / "tests" / "images"
DEMO_EVAL_FILENAME = "demo_results.json"
