# Mock Model Loader for Development
# Simulates ML model loading and inference

import random
import time
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any
import logging

logger = logging.getLogger(__name__)


class MockYOLOModel:
    """Mock YOLO model for drowsiness detection"""

    def __init__(self):
        self.name = "yolo"
        self.is_loaded = True
        self.accuracy = 0.87
        self.inference_speed = "fast"

    def detect_drowsiness(self, image) -> Tuple[bool, float, Optional[Dict]]:
        """
        Mock drowsiness detection
        Returns: (is_drowsy, confidence, bbox)
        """
        # Simulate processing time
        time.sleep(random.uniform(0.1, 0.3))

        # Simulate detection results
        is_drowsy = random.random() < 0.3  # 30% chance of drowsiness
        confidence = (
            random.uniform(0.6, 0.95) if is_drowsy else random.uniform(0.1, 0.5)
        )

        # Mock bounding box for drowsy detection
        bbox = None
        if is_drowsy:
            # Simulate face bounding box coordinates
            bbox = {
                "x": random.randint(50, 150),
                "y": random.randint(50, 150),
                "width": random.randint(100, 200),
                "height": random.randint(120, 250),
            }

        return is_drowsy, round(confidence, 3), bbox


class MockFasterRCNNModel:
    """Mock Faster R-CNN model for drowsiness detection"""

    def __init__(self):
        self.name = "faster_rcnn"
        self.is_loaded = True
        self.accuracy = 0.91
        self.inference_speed = "slow"

    def predict(self, processed_image) -> Tuple[bool, float, Optional[Dict]]:
        """
        Mock prediction
        Returns: (is_drowsy, confidence, bbox)
        """
        # Simulate longer processing time
        time.sleep(random.uniform(0.5, 1.2))

        # Higher accuracy model - more confident results
        is_drowsy = random.random() < 0.25  # 25% chance
        confidence = (
            random.uniform(0.75, 0.98) if is_drowsy else random.uniform(0.05, 0.3)
        )

        bbox = None
        if is_drowsy:
            bbox = {
                "x": random.randint(40, 120),
                "y": random.randint(40, 120),
                "width": random.randint(120, 220),
                "height": random.randint(140, 280),
            }

        return is_drowsy, round(confidence, 3), bbox


class MockVGG16Model:
    """Mock VGG16 model for drowsiness classification"""

    def __init__(self):
        self.name = "vgg16"
        self.is_loaded = True
        self.accuracy = 0.83
        self.inference_speed = "medium"

    def classify(self, processed_image) -> Tuple[bool, float]:
        """
        Mock classification (no bbox detection)
        Returns: (is_drowsy, confidence)
        """
        # Simulate medium processing time
        time.sleep(random.uniform(0.2, 0.6))

        # Classification only - no bounding box
        is_drowsy = random.random() < 0.35  # 35% chance
        confidence = random.uniform(0.5, 0.9) if is_drowsy else random.uniform(0.1, 0.6)

        return is_drowsy, round(confidence, 3)


class ModelLoader:
    """Mock Model Loader - Simulates loading ML models"""

    def __init__(self):
        self.models: Dict[str, Any] = {}
        self.model_info = {
            "yolo": {
                "name": "yolo",
                "displayName": "YOLOv8 Object Detection",
                "description": "Fast real-time object detection optimized for mobile devices",
                "accuracy": 0.87,
                "speed": "fast",
                "memoryUsage": "medium",
                "isAvailable": True,
            },
            "faster_rcnn": {
                "name": "faster_rcnn",
                "displayName": "Faster R-CNN",
                "description": "High accuracy object detection with region proposals",
                "accuracy": 0.91,
                "speed": "slow",
                "memoryUsage": "high",
                "isAvailable": True,
            },
            "vgg16": {
                "name": "vgg16",
                "displayName": "VGG16 Classifier",
                "description": "Deep CNN for binary drowsiness classification",
                "accuracy": 0.83,
                "speed": "medium",
                "memoryUsage": "low",
                "isAvailable": True,
            },
        }

    def load_all_models(self):
        """Load all available models"""
        try:
            logger.info("Loading mock models...")

            # Simulate model loading time
            time.sleep(1)

            # Load mock models
            self.models["yolo"] = MockYOLOModel()
            logger.info("✅ YOLO model loaded")

            self.models["faster_rcnn"] = MockFasterRCNNModel()
            logger.info("✅ Faster R-CNN model loaded")

            self.models["vgg16"] = MockVGG16Model()
            logger.info("✅ VGG16 model loaded")

            logger.info(f"All {len(self.models)} models loaded successfully")

        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise

    def get_model(self, model_name: str):
        """Get a specific model by name"""
        return self.models.get(model_name)

    def get_loaded_models(self) -> List[str]:
        """Get list of loaded model names"""
        return list(self.models.keys())

    def get_model_info(self) -> List[Dict]:
        """Get detailed information about all models"""
        return list(self.model_info.values())

    def is_model_loaded(self, model_name: str) -> bool:
        """Check if a specific model is loaded"""
        return model_name in self.models

    def get_model_stats(self) -> Dict:
        """Get statistics about loaded models"""
        return {
            "total_models": len(self.models),
            "loaded_models": list(self.models.keys()),
            "memory_usage": {
                "yolo": "~200MB",
                "faster_rcnn": "~500MB",
                "vgg16": "~100MB",
            },
            "last_loaded": datetime.utcnow().isoformat(),
        }
