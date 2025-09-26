# Hybrid Model Loader - supports both Mock and Real models
# Can fallback to mock data when real model is not available

import os
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any

logger = logging.getLogger(__name__)

# Define the 7 classes from the trained model
DRIVER_CLASSES = [
    "awake-or-distracted",  # 0 ตื่นหรือวอกแวก
    "dangerous-driving",  # 1 (DangerousDriving) (เช่น ใช้โทรศัพท์)
    "distracted",  # 2 (Distracted) (เช่น มองไปทางอื่น)
    "drinking",  # 3 (Drinking) (เช่น ดื่มน้ำ)
    "safe-driving",  # 4 (SafeDriving) (เช่น ขับรถอย่างปลอดภัย)
    "sleepy-driving",  # 5 (SleepyDriving) (เช่น ขับรถอย่างง่วง)
    "yawning",  # 6 (Yawn) (เช่น หาว)
]

# Classes that indicate drowsiness/danger - need alert
DROWSY_CLASSES = [
    1,
    2,
    3,
    5,
    6,
]  # dangerous-driving, distracted, drinking, sleepy-driving, yawning
SAFE_CLASSES = [0, 4]  # awake-or-distracted, safe-driving


class HybridModelLoader:
    """Model loader that tries real models first, falls back to mock if needed"""

    def __init__(self, model_dir: str = "."):
        self.model_dir = model_dir
        self.models = {}
        self.use_real_models = False
        self.load_models()

    def load_models(self):
        """Try to load real models, fallback to mock if not available"""
        try:
            # Check if we have real model files
            model_path = os.path.join(self.model_dir, "fasterrcnn_scripted.pt")

            if os.path.exists(model_path):
                logger.info("Real model file found, attempting to load real models...")
                try:
                    from .real_model_loader import RealModelLoader

                    real_loader = RealModelLoader(self.model_dir)
                    self.models = real_loader.models
                    self.use_real_models = True
                    logger.info("✅ Real models loaded successfully")
                    return
                except Exception as e:
                    logger.warning(f"Failed to load real models: {e}")
                    logger.info("Falling back to mock models...")

            # Fallback to mock models
            logger.info("Loading mock models for development...")
            from .model_loader import model_loader as mock_loader

            self.models = mock_loader.models
            self.use_real_models = False
            logger.info("✅ Mock models loaded successfully")

        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise

    def get_model(self, model_name: str):
        """Get a specific model by name"""
        if self.use_real_models:
            # Map common names to our real model
            name_mapping = {
                "yolo": "faster_rcnn",
                "faster_rcnn": "faster_rcnn",
                "vgg16": "faster_rcnn",
            }
            mapped_name = name_mapping.get(model_name, "faster_rcnn")
            return self.models.get(mapped_name)
        else:
            # Use mock models directly
            return self.models.get(model_name)

    def get_all_models(self) -> Dict:
        """Get information about all loaded models"""
        if self.use_real_models:
            return {
                name: {
                    "name": model.name,
                    "is_loaded": model.is_loaded,
                    "accuracy": model.accuracy,
                    "inference_speed": model.inference_speed,
                    "type": "real",
                }
                for name, model in self.models.items()
            }
        else:
            return {
                name: {
                    "name": model.name,
                    "is_loaded": model.is_loaded,
                    "accuracy": model.accuracy,
                    "inference_speed": model.inference_speed,
                    "type": "mock",
                }
                for name, model in self.models.items()
            }

    def get_model_info(self, model_name: str) -> Optional[Dict]:
        """Get information about a specific model"""
        model = self.get_model(model_name)
        if not model:
            return None

        base_info = {
            "name": model.name,
            "is_loaded": model.is_loaded,
            "accuracy": model.accuracy,
            "inference_speed": model.inference_speed,
            "supported_classes": DRIVER_CLASSES,
            "drowsy_classes": [DRIVER_CLASSES[i] for i in DROWSY_CLASSES],
            "safe_classes": [DRIVER_CLASSES[i] for i in SAFE_CLASSES],
            "model_type": "Real Faster R-CNN" if self.use_real_models else "Mock Model",
            "mode": "production" if self.use_real_models else "development",
        }

        if self.use_real_models and hasattr(model, "device"):
            base_info["device"] = str(model.device)

        return base_info

    def detect_drowsiness(self, image, model_name: str = "yolo") -> Dict[str, Any]:
        """
        Perform drowsiness detection using available model (real or mock)
        Returns standardized result format
        """
        model = self.get_model(model_name)
        if not model:
            raise ValueError(f"Model '{model_name}' not found")

        try:
            if self.use_real_models:
                # Use real model prediction
                is_drowsy, confidence, bbox, class_name, class_id = model.predict(image)
                model_used = model.name
            else:
                # Use mock model prediction (existing logic)
                if model_name == "yolo" or hasattr(model, "detect_drowsiness"):
                    is_drowsy, confidence, bbox, class_name, class_id = (
                        model.detect_drowsiness(image)
                    )
                elif model_name == "faster_rcnn" or hasattr(model, "predict"):
                    is_drowsy, confidence, bbox, class_name, class_id = model.predict(
                        image
                    )
                elif model_name == "vgg16" or hasattr(model, "classify"):
                    is_drowsy, confidence, class_name, class_id = model.classify(image)
                    bbox = None
                else:
                    raise ValueError(f"Unknown model method for {model_name}")

                model_used = model.name

            return {
                "is_drowsy": is_drowsy,
                "confidence": confidence,
                "class_name": class_name,
                "class_id": class_id,
                "bbox": bbox,
                "model_used": model_used,
                "model_mode": "production" if self.use_real_models else "development",
                "timestamp": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error during {model_name} detection: {e}")
            raise


# Global hybrid model loader instance
hybrid_model_loader = HybridModelLoader()
