# Image Processing Utilities
# Handles base64 decoding, image preprocessing, and format conversion

import base64
import io
import numpy as np
from PIL import Image
import logging
from typing import Optional, Tuple, Any

# Try to import cv2 (OpenCV) - make it optional
try:
    import cv2

    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    print("⚠️ OpenCV (cv2) not available - some features may be limited")

logger = logging.getLogger(__name__)


class ImageProcessor:
    """Image processing utilities for drowsiness detection"""

    def __init__(self):
        self.supported_formats = ["JPEG", "JPG", "PNG", "WEBP"]
        self.max_image_size = (1920, 1080)  # Max resolution
        self.min_image_size = (64, 64)  # Min resolution

    def decode_base64_image(self, base64_string: str) -> Optional[np.ndarray]:
        """
        Decode base64 string to OpenCV image (numpy array)

        Args:
            base64_string: Base64 encoded image string

        Returns:
            OpenCV image array or None if failed
        """
        try:
            # Remove data URL prefix if present
            if "," in base64_string:
                base64_string = base64_string.split(",")[1]

            # Decode base64
            image_data = base64.b64decode(base64_string)

            # Convert to PIL Image
            pil_image = Image.open(io.BytesIO(image_data))

            # Validate image format
            if pil_image.format not in self.supported_formats:
                logger.warning(f"Unsupported image format: {pil_image.format}")
                return None

            # Validate image size
            width, height = pil_image.size
            if (
                width < self.min_image_size[0]
                or height < self.min_image_size[1]
                or width > self.max_image_size[0]
                or height > self.max_image_size[1]
            ):
                logger.warning(f"Image size {width}x{height} outside valid range")

            # Convert to RGB if needed
            if pil_image.mode in ["RGBA", "LA"]:
                # Create white background
                background = Image.new("RGB", pil_image.size, (255, 255, 255))
                if pil_image.mode == "RGBA":
                    background.paste(pil_image, mask=pil_image.split()[-1])
                else:  # LA mode
                    background.paste(pil_image, mask=pil_image.split()[-1])
                pil_image = background
            elif pil_image.mode != "RGB":
                pil_image = pil_image.convert("RGB")

            # Convert PIL to numpy array (keep RGB format for YOLO)
            # YOLO models can handle RGB directly, no need to convert to BGR
            rgb_image = np.array(pil_image)

            logger.info(f"Successfully decoded image: {rgb_image.shape}")
            return rgb_image

        except Exception as e:
            logger.error(f"Error decoding base64 image: {e}")
            return None

    def preprocess_for_model(self, image: np.ndarray, model_name: str) -> np.ndarray:
        """
        Preprocess image for specific model requirements

        Args:
            image: OpenCV image array
            model_name: Name of the model. Currently optimized for 'yolo'.

        Returns:
            Preprocessed image array
        """
        try:
            # YOLO-only for now. For future models, add dedicated branches here.
            return self._preprocess_yolo(image)

        except Exception as e:
            logger.error(f"Error preprocessing image for {model_name}: {e}")
            return image

    def _preprocess_yolo(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for YOLO model"""
        # YOLO typically uses 640x640 input
        target_size = (640, 640)

        # Resize while maintaining aspect ratio
        h, w = image.shape[:2]
        scale = min(target_size[0] / w, target_size[1] / h)
        new_w, new_h = int(w * scale), int(h * scale)

        # Resize image
        resized = cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)

        # Create padded image
        padded = np.full((*target_size, 3), 114, dtype=np.uint8)  # Gray padding

        # Center the resized image
        y_offset = (target_size[1] - new_h) // 2
        x_offset = (target_size[0] - new_w) // 2
        padded[y_offset : y_offset + new_h, x_offset : x_offset + new_w] = resized

        # Normalize to [0, 1] and convert to float32
        padded = padded.astype(np.float32) / 255.0

        logger.debug(f"YOLO preprocessing: {image.shape} -> {padded.shape}")
        return padded

    # Note: Additional preprocessors for future models can be added here

    def _preprocess_default(self, image: np.ndarray) -> np.ndarray:
        """Default preprocessing - basic normalization"""
        # Simple resize and normalize
        resized = cv2.resize(image, (416, 416), interpolation=cv2.INTER_LINEAR)
        normalized = resized.astype(np.float32) / 255.0

        logger.debug(f"Default preprocessing: {image.shape} -> {normalized.shape}")
        return normalized

    def validate_image(self, image: np.ndarray) -> Tuple[bool, str]:
        """
        Validate image for processing

        Args:
            image: OpenCV image array

        Returns:
            (is_valid, error_message)
        """
        try:
            if image is None:
                return False, "Image is None"

            if len(image.shape) != 3:
                return False, "Image must have 3 dimensions (H, W, C)"

            if image.shape[2] != 3:
                return False, "Image must have 3 color channels"

            height, width = image.shape[:2]

            if width < self.min_image_size[0] or height < self.min_image_size[1]:
                return (
                    False,
                    f"Image too small: {width}x{height} (min: {self.min_image_size})",
                )

            if width > self.max_image_size[0] or height > self.max_image_size[1]:
                return (
                    False,
                    f"Image too large: {width}x{height} (max: {self.max_image_size})",
                )

            # Check if image is completely black or white
            if np.all(image == 0):
                return False, "Image is completely black"

            if np.all(image == 255):
                return False, "Image is completely white"

            return True, "Valid image"

        except Exception as e:
            return False, f"Validation error: {e}"

    def get_image_info(self, image: np.ndarray) -> dict:
        """Get information about the image"""
        try:
            height, width, channels = image.shape

            return {
                "width": width,
                "height": height,
                "channels": channels,
                "dtype": str(image.dtype),
                "size_bytes": image.nbytes,
                "mean_brightness": float(np.mean(image)),
                "min_value": int(np.min(image)),
                "max_value": int(np.max(image)),
            }
        except Exception as e:
            logger.error(f"Error getting image info: {e}")
            return {}

    def resize_image(
        self,
        image: np.ndarray,
        target_size: Tuple[int, int],
        maintain_aspect: bool = True,
    ) -> np.ndarray:
        """
        Resize image with optional aspect ratio preservation

        Args:
            image: Input image
            target_size: (width, height) target size
            maintain_aspect: Whether to maintain aspect ratio

        Returns:
            Resized image
        """
        try:
            if maintain_aspect:
                h, w = image.shape[:2]
                scale = min(target_size[0] / w, target_size[1] / h)
                new_w, new_h = int(w * scale), int(h * scale)
                return cv2.resize(image, (new_w, new_h), interpolation=cv2.INTER_LINEAR)
            else:
                return cv2.resize(image, target_size, interpolation=cv2.INTER_LINEAR)

        except Exception as e:
            logger.error(f"Error resizing image: {e}")
            return image
