# Real Model Loader for Production
# Loads and runs inference with trained YOLO and Faster R-CNN models

import torch
import torchvision.transforms as T
import numpy as np
from PIL import Image
from datetime import datetime
from typing import Dict, List, Tuple, Optional, Any
import logging
import os
from pathlib import Path
import cv2

# Try to import YOLO dependencies
try:
    from ultralytics import YOLO

    YOLO_AVAILABLE = True
    print("✅ YOLO (Ultralytics) dependencies available")
except ImportError as e:
    YOLO_AVAILABLE = False
    print(f"❌ YOLO dependencies not available: {e}")

logger = logging.getLogger(__name__)


# Helper utilities for class handling (name-based, model-agnostic)
def _is_drowsy_class_name(name: str) -> str:
    name = name.lower()
    drowsy_keywords = ["drowsy"]
    distracted_keywords = [
        "distracted",
        "drinking",
        "eating",
        "phoneuse",
        "smoking",
    ]
    safe_keywords = ["safe-driving", "safe_driving", "safedriving", "seatbelt"]

    if name in drowsy_keywords:
        return "drowsy"
    elif name in distracted_keywords:
        return "distracted"
    elif name in safe_keywords:
        return "safe"
    else:
        # นอกเหนือจากนี้ถือเป็น unknown คือไม่รู้
        return "unknown"

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

            # Convert to class info (labels are dataset-dependent)
            class_id = int(best_label.item())
            # Without a dynamic mapping for Faster R-CNN, use label id as-is
            # and a generic name string
            class_name = str(class_id)
            confidence = float(best_score.item())

            # Determine if drowsy by name (unknown mapping → assume non-drowsy)
            answer = _is_drowsy_class_name(class_name)

            # Convert bbox to format expected by API
            x1, y1, x2, y2 = best_box.tolist()
            bbox = {
                "x": int(x1),
                "y": int(y1),
                "width": int(x2 - x1),
                "height": int(y2 - y1),
            }

            logger.info(
                f"Prediction: {class_name} (confidence: {confidence:.3f}, drowsy: {answer})"
            )
            return answer, confidence, bbox, class_name, class_id

        except Exception as e:
            logger.error(f"Error during inference: {e}")
            raise


class RealYOLOModel:
    """Real YOLO model for drowsiness detection"""

    def __init__(self, model_path=None):
        """
        Initialize YOLO model loader.

        Args:
            model_path (str): Path to YOLO model file (.pt format)
        """
        if not YOLO_AVAILABLE:
            raise ImportError(
                "YOLO dependencies not available. Install with: pip install ultralytics opencv-python"
            )

        self.model_path = model_path or "yolo.pt"
        self.model = None
        self.is_loaded = False
        self.name = "Real YOLO v8"
        self.accuracy = 0.92
        self.inference_speed = 0.05
        print(f"🎯 RealYOLOModel initialized with model path: {self.model_path}")

        # Load model automatically
        self.load_model()

    def load_model(self):
        """Load the YOLO model"""
        try:
            if not os.path.exists(self.model_path):
                print(f"❌ Model file not found: {self.model_path}")
                raise FileNotFoundError(f"Model file not found: {self.model_path}")

            print(f"📥 Loading YOLO model from {self.model_path}")
            self.model = YOLO(self.model_path)
            self.is_loaded = True
            print(f"✅ YOLO model loaded successfully")

        except Exception as e:
            print(f"❌ Error loading YOLO model: {e}")
            self.is_loaded = False
            raise

    def predict(self, pil_image: Image.Image):
        """
        Predict drowsiness from PIL Image

        Returns:
            Tuple: (is_drowsy, confidence, bbox, class_name, class_id)
        """
        if not self.is_loaded:
            raise RuntimeError("Model not loaded")

        try:
            # Convert PIL to numpy array for YOLO
            import numpy as np

            # Keep as RGB (don't convert to BGR)
            # Ultralytics YOLO can accept PIL Image directly which preserves RGB
            # Or we can pass numpy array but need to ensure it stays RGB
            img_array = np.array(pil_image)

            # Run inference with RGB image (bgr=False ensures no BGR conversion during augmentation)
            # Note: During inference (predict), YOLO expects RGB by default when passing numpy arrays
            results = self.model(img_array, verbose=False)

            # Process results
            if not results or len(results) == 0:
                print("🤷‍♂️ No detections found")
                return "safe", 0.0, None, "safe-driving", 4

            # หา result ที่มี boxes มากที่สุด (ถ้ามีหลาย result)
            result = max(
                results, key=lambda r: len(r.boxes) if r.boxes is not None else 0
            )

            if result.boxes is None or len(result.boxes) == 0:
                print("🤷‍♂️ No bounding boxes found")
                return "safe", 0.0, None, "safe-driving", 4

            # Get the highest confidence detection
            boxes = result.boxes
            confidences = boxes.conf.cpu().numpy()
            classes = boxes.cls.cpu().numpy()
            xyxy = boxes.xyxy.cpu().numpy()

            # Find best detection
            best_idx = np.argmax(confidences)
            best_conf = float(confidences[best_idx])
            best_class = int(classes[best_idx])
            best_box = xyxy[best_idx]

            # Get class names mapping
            class_names = result.names

            class_name = class_names.get(best_class, "unknown")
            # Determine drowsiness by class name
            answer = _is_drowsy_class_name(class_name)

            # Convert bbox format
            x1, y1, x2, y2 = best_box
            bbox = {
                "x": int(x1),
                "y": int(y1),
                "width": int(x2 - x1),
                "height": int(y2 - y1),
            }

            print(
                f"🎯 YOLO Prediction: {class_name} (conf: {best_conf:.3f}, drowsy: {answer})"
            )
            return answer, best_conf, bbox, class_name, best_class

        except Exception as e:
            print(f"❌ Error during YOLO inference: {e}")
            raise


PROJECT_ROOT = Path(__file__).resolve().parents[3]  # Go up 3 levels: models -> backend -> src -> root
DEFAULT_MODEL_DIR = Path(os.getenv("MODEL_DIR", PROJECT_ROOT / "models" / "weights")).resolve()


class RealModelLoader:
    """Main model loader class - manages real trained models"""

    def __init__(self, model_dir: str | Path = DEFAULT_MODEL_DIR):
        self.model_dir = Path(model_dir).resolve()
        self.models = {}
        self.load_models()

    def load_models(self):
        """Initialize real trained models"""
        try:
            print("📦 Loading real trained models...")
            print(f"🔍 PROJECT_ROOT: {PROJECT_ROOT}")
            print(f"🔍 Model directory: {self.model_dir}")

            # Check for YOLO model first (try multiple paths)
            yolo_paths = [
                PROJECT_ROOT / "models" / "weights" / "yolo.pt",  # Primary path
                self.model_dir / "yolo.pt",
                PROJECT_ROOT / "models" / "yolo.pt",
                Path.cwd() / "yolo.pt",
            ]

            yolo_loaded = False
            for yolo_path in yolo_paths:
                print(f"🔍 Checking YOLO path: {yolo_path} (exists: {yolo_path.exists()})")
                if yolo_path.exists() and YOLO_AVAILABLE:
                    try:
                        self.models["yolo"] = RealYOLOModel(str(yolo_path))
                        print(
                            f"✅ Real YOLO model loaded successfully from {yolo_path}"
                        )
                        yolo_loaded = True
                        break
                    except Exception as e:
                        print(f"⚠️ Failed to load YOLO model from {yolo_path}: {e}")

            if not yolo_loaded and YOLO_AVAILABLE:
                print("ℹ️ YOLO model not found in any expected location")

            # Check for Faster R-CNN model
            frcnn_path = self.model_dir / "fasterrcnn_scripted.pt"
            if frcnn_path.exists():
                try:
                    self.models["faster_rcnn"] = RealFasterRCNNModel(str(frcnn_path))
                    print("✅ Real Faster R-CNN model loaded successfully")
                except Exception as e:
                    print(f"⚠️ Failed to load Faster R-CNN model: {e}")

            # Summary
            print(f"📊 Models loaded: {list(self.models.keys())}")
            if not self.models:
                print("⚠️ No real models could be loaded - will fall back to mock")

        except Exception as e:
            print(f"❌ Error loading real models: {e}")
            # Don't raise - allow fallback to mock models

    def get_model(self, model_name: str) -> Optional[Any]:
        """Get a specific model by name"""
        # Direct model mapping first
        if model_name in self.models:
            return self.models[model_name]

        # Fallback mapping for common requests
        name_mapping = {
            "yolo": "yolo" if "yolo" in self.models else None,
        }

        mapped_name = name_mapping.get(model_name)
        if mapped_name and mapped_name in self.models:
            return self.models[mapped_name]

        # No fallback to other architectures when only YOLO is supported
        return None

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

        model_type = "YOLOv8" if "yolo" in str(model.name).lower() else "Faster R-CNN"
        # Build class info dynamically when possible (YOLO has model.names)
        supported_classes: List[str] = []
        drowsy_names: List[str] = []
        safe_names: List[str] = []

        try:
            if hasattr(model, "model") and hasattr(model.model, "names"):
                # Ultralytics mapping id->name
                names_map = getattr(model.model, "names", {}) or {}
                supported_classes = [str(v) for _, v in sorted(names_map.items())]
                for n in supported_classes:
                    if _is_drowsy_class_name(n) == "drowsy":
                        drowsy_names.append(n)
                    else:
                        safe_names.append(n)
        except Exception:
            pass

        return {
            "name": model.name,
            "is_loaded": model.is_loaded,
            "accuracy": getattr(model, "accuracy", None),
            "inference_speed": getattr(model, "inference_speed", None),
            "supported_classes": supported_classes,
            "drowsy_classes": drowsy_names,
            "safe_classes": safe_names,
            "model_type": model_type,
            "device": str(getattr(model, "device", "cpu")),
        }

    def detect_drowsiness(self, image, model_name: str = "yolo"):
        """
        Perform drowsiness detection using real trained model
        Returns standardized best_idx format
        """
        model: RealYOLOModel = self.get_model(model_name)
        if not model:
            raise ValueError(f"Model '{model_name}' not found")

        try:
            answer, confidence, bbox, class_name, class_id = model.predict(image)
            print(f"Detection results - Category: {answer}, Confidence: {confidence}")
            return {
                "is_drowsy": answer,  # Now returns 4-class category: "drowsy", "distracted", "safety-violation", "safe"
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
