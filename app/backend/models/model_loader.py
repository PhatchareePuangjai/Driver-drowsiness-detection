# Mock Model Loader for Development
# Simulates ML model loading and inference with 7-class detection

import random
import time
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any
import logging

logger = logging.getLogger(__name__)

# Define the 7 classes from your model
DRIVER_CLASSES = [
    "awake-or-distracted",  # 0 - Alert but may be distracted
    "DangerousDriving",  # 1 - Dangerous behavior
    "Distracted",  # 2 - Distracted driving
    "Drinking",  # 3 - Drinking while driving
    "SafeDriving",  # 4 - Safe, alert driving
    "SleepyDriving",  # 5 - Sleepy/drowsy driving
    "Yawn",  # 6 - Yawning (sign of drowsiness)
]

# Classes that indicate drowsiness/danger - need alert
DROWSY_CLASSES = [
    1,
    2,
    3,
    5,
    6,
]  # DangerousDriving, Distracted, Drinking, SleepyDriving, Yawn
SAFE_CLASSES = [0, 4]  # awake-or-distracted, SafeDriving


class MockYOLOModel:
    """Mock YOLO model for drowsiness detection with 7-class classification"""

    def __init__(self):
        self.name = "yolo"
        self.is_loaded = True
        self.accuracy = 0.87
        self.inference_speed = "fast"

    def detect_drowsiness(self, image) -> Tuple[bool, float, Optional[Dict], str, int]:
        """
        Mock drowsiness detection with class prediction
        Returns: (is_drowsy, confidence, bbox, class_name, class_id)
        """
        # Simulate processing time
        time.sleep(random.uniform(0.1, 0.3))

        # Simulate class prediction (weighted towards safe driving)
        class_probabilities = [
            0.15,
            0.10,
            0.15,
            0.05,
            0.35,
            0.15,
            0.05,
        ]  # Probabilities for each class
        class_id = np.random.choice(len(DRIVER_CLASSES), p=class_probabilities)
        class_name = DRIVER_CLASSES[class_id]

        # Determine if drowsy based on predicted class
        is_drowsy = class_id in DROWSY_CLASSES

        # Generate confidence based on class (dangerous classes get higher confidence)
        if is_drowsy:
            confidence = random.uniform(
                0.65, 0.95
            )  # Higher confidence for dangerous cases
        else:
            confidence = random.uniform(0.70, 0.90)  # Good confidence for safe cases

        # Mock bounding box for any detection
        bbox = {
            "x": random.randint(50, 150),
            "y": random.randint(50, 150),
            "width": random.randint(100, 200),
            "height": random.randint(120, 250),
        }

        return is_drowsy, round(confidence, 3), bbox, class_name, class_id


class MockFasterRCNNModel:
    """Mock Faster R-CNN model for drowsiness detection with 7-class classification"""

    def __init__(self):
        self.name = "faster_rcnn"
        self.is_loaded = True
        self.accuracy = 0.91
        self.inference_speed = "slow"

    def predict(self, processed_image) -> Tuple[bool, float, Optional[Dict], str, int]:
        """
        Mock prediction with class detection
        Returns: (is_drowsy, confidence, bbox, class_name, class_id)
        """
        # Simulate longer processing time
        time.sleep(random.uniform(0.5, 1.2))

        # Higher accuracy model - more accurate class predictions
        class_probabilities = [
            0.12,
            0.08,
            0.12,
            0.03,
            0.45,
            0.12,
            0.08,
        ]  # More accurate distribution
        class_id = np.random.choice(len(DRIVER_CLASSES), p=class_probabilities)
        class_name = DRIVER_CLASSES[class_id]

        is_drowsy = class_id in DROWSY_CLASSES

        # Higher confidence due to better model
        if is_drowsy:
            confidence = random.uniform(0.75, 0.98)
        else:
            confidence = random.uniform(0.80, 0.95)

        bbox = {
            "x": random.randint(40, 120),
            "y": random.randint(40, 120),
            "width": random.randint(120, 220),
            "height": random.randint(140, 280),
        }

        return is_drowsy, round(confidence, 3), bbox, class_name, class_id


class MockVGG16Model:
    """Mock VGG16 model for drowsiness classification with 7-class classification"""

    def __init__(self):
        self.name = "vgg16"
        self.is_loaded = True
        self.accuracy = 0.83
        self.inference_speed = "medium"

    def classify(self, processed_image) -> Tuple[bool, float, str, int]:
        """
        Mock classification (no bbox detection, only classification)
        Returns: (is_drowsy, confidence, class_name, class_id)
        """
        # Simulate medium processing time
        time.sleep(random.uniform(0.2, 0.6))

        # Classification model - slightly different distribution
        class_probabilities = [0.18, 0.12, 0.18, 0.07, 0.25, 0.15, 0.05]
        class_id = np.random.choice(len(DRIVER_CLASSES), p=class_probabilities)
        class_name = DRIVER_CLASSES[class_id]

        is_drowsy = class_id in DROWSY_CLASSES

        # Moderate confidence for classification model
        if is_drowsy:
            confidence = random.uniform(0.60, 0.90)
        else:
            confidence = random.uniform(0.65, 0.85)

        return is_drowsy, round(confidence, 3), class_name, class_id


class ModelLoader:
    """Main model loader class - manages all mock models"""

    def __init__(self):
        self.models = {}
        self.load_models()

    def load_models(self):
        """Initialize all mock models"""
        try:
            logger.info("Loading mock models...")
            self.models = {
                "yolo": MockYOLOModel(),
                "faster_rcnn": MockFasterRCNNModel(),
                "vgg16": MockVGG16Model(),
            }
            logger.info(f"Successfully loaded {len(self.models)} models")
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise

    def get_model(self, model_name: str):
        """Get a specific model by name"""
        return self.models.get(model_name)

    def get_all_models(self) -> Dict:
        """Get information about all loaded models"""
        return {
            name: {
                "name": model.name,
                "is_loaded": model.is_loaded,
                "accuracy": model.accuracy,
                "inference_speed": model.inference_speed,
            }
            for name, model in self.models.items()
        }

    def get_model_info(self, model_name: str) -> Optional[Dict]:
        """Get information about a specific model"""
        model = self.get_model(model_name)
        if not model:
            return None

        return {
            "name": model.name,
            "is_loaded": model.is_loaded,
            "accuracy": model.accuracy,
            "inference_speed": model.inference_speed,
            "supported_classes": DRIVER_CLASSES,
            "drowsy_classes": [DRIVER_CLASSES[i] for i in DROWSY_CLASSES],
            "safe_classes": [DRIVER_CLASSES[i] for i in SAFE_CLASSES],
        }

    def detect_drowsiness(self, image, model_name: str = "yolo") -> Dict[str, Any]:
        """
        Perform drowsiness detection using specified model
        Returns standardized result format
        """
        model = self.get_model(model_name)
        if not model:
            raise ValueError(f"Model '{model_name}' not found")

        try:
            if model_name == "yolo":
                is_drowsy, confidence, bbox, class_name, class_id = (
                    model.detect_drowsiness(image)
                )
                return {
                    "is_drowsy": is_drowsy,
                    "confidence": confidence,
                    "class_name": class_name,
                    "class_id": class_id,
                    "bbox": bbox,
                    "model_used": model_name,
                    "timestamp": datetime.now().isoformat(),
                }

            elif model_name == "faster_rcnn":
                is_drowsy, confidence, bbox, class_name, class_id = model.predict(image)
                return {
                    "is_drowsy": is_drowsy,
                    "confidence": confidence,
                    "class_name": class_name,
                    "class_id": class_id,
                    "bbox": bbox,
                    "model_used": model_name,
                    "timestamp": datetime.now().isoformat(),
                }

            elif model_name == "vgg16":
                is_drowsy, confidence, class_name, class_id = model.classify(image)
                return {
                    "is_drowsy": is_drowsy,
                    "confidence": confidence,
                    "class_name": class_name,
                    "class_id": class_id,
                    "bbox": None,  # VGG16 doesn't provide bounding box
                    "model_used": model_name,
                    "timestamp": datetime.now().isoformat(),
                }

        except Exception as e:
            logger.error(f"Error during {model_name} detection: {e}")
            raise


# Global model loader instance
model_loader = ModelLoader()


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
