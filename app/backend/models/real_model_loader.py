# Real Model Loader for Production
# Loads and runs inference with trained Faster R-CNN model

import torch
import torchvision.transforms as T
import numpy as np
from PIL import Image
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any
import logging
import os

logger = logging.getLogger(__name__)

# Define the 7 classes from your trained model
DRIVER_CLASSES = [
    "awake-or-distracted",  # 0
    "dangerous-driving",  # 1 (changed from DangerousDriving to match notebook)
    "distracted",  # 2
    "drinking",  # 3
    "safe-driving",  # 4 (changed from SafeDriving to match notebook)
    "sleepy-driving",  # 5 (changed from SleepyDriving to match notebook)
    "yawning",  # 6 (changed from Yawn to match notebook)
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


class RealFasterRCNNModel:
    """Real Faster R-CNN model for drowsiness detection with 7-class classification"""

    def __init__(self, model_path: str = "fasterrcnn_scripted.pt"):
        self.name = "faster_rcnn_real"
        self.model_path = model_path
        self.model = None
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.is_loaded = False
        self.accuracy = 0.91  # Based on your training results
        self.inference_speed = "medium"

        # Image preprocessing transforms to match training
        self.transform = T.Compose(
            [
                T.ToTensor(),
                # Note: Faster R-CNN typically doesn't need normalization
                # as it's handled internally, but you can add if needed:
                # T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ]
        )

        self.load_model()

    def load_model(self):
        """Load the TorchScript model"""
        try:
            if not os.path.exists(self.model_path):
                logger.error(f"Model file not found: {self.model_path}")
                raise FileNotFoundError(f"Model file not found: {self.model_path}")

            logger.info(f"Loading Faster R-CNN model from {self.model_path}")
            self.model = torch.jit.load(self.model_path, map_location=self.device)
            self.model.eval()
            self.is_loaded = True
            logger.info(f"Model loaded successfully on {self.device}")

        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.is_loaded = False
            raise

    def preprocess_image(self, pil_image: Image.Image) -> torch.Tensor:
        """
        Preprocess PIL image for model inference
        Resize to match training size (800x800 as per your notebook)
        """
        try:
            # Convert to RGB if needed
            if pil_image.mode != "RGB":
                pil_image = pil_image.convert("RGB")

            # Resize to match training size
            # Faster R-CNN can handle different sizes, but consistency helps
            original_size = pil_image.size
            target_size = (800, 800)  # As per your notebook
            pil_image = pil_image.resize(target_size, Image.Resampling.BILINEAR)

            # Apply transforms
            tensor_image = self.transform(pil_image)

            logger.debug(
                f"Image preprocessed: {original_size} -> {target_size}, tensor shape: {tensor_image.shape}"
            )
            return tensor_image

        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            raise

    def predict(
        self, pil_image: Image.Image, confidence_threshold: float = 0.7
    ) -> Tuple[bool, float, Optional[Dict], str, int]:
        """
        Run inference on the image
        Returns: (is_drowsy, confidence, bbox, class_name, class_id)
        """
        if not self.is_loaded:
            raise RuntimeError("Model not loaded")

        try:
            # Preprocess image
            tensor_image = self.preprocess_image(pil_image)
            tensor_image = tensor_image.to(self.device)

            # Run inference
            with torch.no_grad():
                # Faster R-CNN expects a list of tensors
                predictions = self.model([tensor_image])

            prediction = predictions[0]  # Get first (and only) prediction

            # Extract results
            boxes = prediction["boxes"].cpu()
            scores = prediction["scores"].cpu()
            labels = prediction["labels"].cpu()

            # Filter by confidence threshold
            keep = scores >= confidence_threshold

            if keep.sum() == 0:
                # No confident detections - return safe default
                logger.info("No confident detections found")
                return False, 0.0, None, "safe-driving", 4

            # Get the highest confidence detection
            best_idx = scores[keep].argmax()
            final_keep = keep.nonzero(as_tuple=True)[0][best_idx]

            best_box = boxes[final_keep]
            best_score = scores[final_keep]
            best_label = labels[final_keep]

            # Convert to class info
            class_id = int(best_label.item())
            if class_id >= len(DRIVER_CLASSES):
                class_id = 4  # Default to safe-driving

            class_name = DRIVER_CLASSES[class_id]
            confidence = float(best_score.item())

            # Determine if drowsy
            is_drowsy = class_id in DROWSY_CLASSES

            # Convert bbox to format expected by API
            x1, y1, x2, y2 = best_box.tolist()
            bbox = {
                "x": int(x1),
                "y": int(y1),
                "width": int(x2 - x1),
                "height": int(y2 - y1),
            }

            logger.info(
                f"Prediction: {class_name} (confidence: {confidence:.3f}, drowsy: {is_drowsy})"
            )
            return is_drowsy, confidence, bbox, class_name, class_id

        except Exception as e:
            logger.error(f"Error during inference: {e}")
            raise


class RealModelLoader:
    """Main model loader class - manages real trained models"""

    def __init__(self, model_dir: str = "."):
        self.model_dir = model_dir
        self.models = {}
        self.load_models()

    def load_models(self):
        """Initialize real trained models"""
        try:
            logger.info("Loading real trained models...")

            # Check for model file
            model_path = os.path.join(self.model_dir, "fasterrcnn_scripted.pt")

            if os.path.exists(model_path):
                self.models["faster_rcnn"] = RealFasterRCNNModel(model_path)
                logger.info("Real Faster R-CNN model loaded successfully")
            else:
                logger.warning(f"Model file not found: {model_path}")
                logger.warning(
                    "Please ensure fasterrcnn_scripted.pt is in the backend directory"
                )
                # Could fall back to mock models here if needed
                raise FileNotFoundError(f"Required model file not found: {model_path}")

        except Exception as e:
            logger.error(f"Error loading real models: {e}")
            raise

    def get_model(self, model_name: str):
        """Get a specific model by name"""
        # Map common names to our real model
        name_mapping = {
            "yolo": "faster_rcnn",  # Use Faster R-CNN for YOLO requests
            "faster_rcnn": "faster_rcnn",
            "vgg16": "faster_rcnn",  # Use Faster R-CNN for VGG16 requests
        }

        mapped_name = name_mapping.get(model_name, "faster_rcnn")
        return self.models.get(mapped_name)

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
            "model_type": "Faster R-CNN",
            "device": str(model.device),
        }

    def detect_drowsiness(
        self, image, model_name: str = "faster_rcnn"
    ) -> Dict[str, Any]:
        """
        Perform drowsiness detection using real trained model
        Returns standardized result format
        """
        model = self.get_model(model_name)
        if not model:
            raise ValueError(f"Model '{model_name}' not found")

        try:
            is_drowsy, confidence, bbox, class_name, class_id = model.predict(image)

            return {
                "is_drowsy": is_drowsy,
                "confidence": confidence,
                "class_name": class_name,
                "class_id": class_id,
                "bbox": bbox,
                "model_used": model.name,
                "timestamp": datetime.now().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error during {model_name} detection: {e}")
            raise


# Global model loader instance
real_model_loader = RealModelLoader()
