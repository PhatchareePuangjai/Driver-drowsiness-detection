#!/usr/bin/env python3
"""
Test script to compare test.py results with real_model_loader.py results
"""

import sys
import os

sys.path.append(
    "/Users/toy/Desktop/learn/Deep learning/Driver-drowsiness-detection/app/backend"
)

from PIL import Image
from models.real_model_loader import RealModelLoader


def test_real_model():
    print("🧪 Testing real_model_loader.py with the same image...")

    # Initialize the model loader
    model_loader = RealModelLoader(
        model_dir="/Users/toy/Desktop/learn/Deep learning/Driver-drowsiness-detection/app/backend/models"
    )

    # Load the same image
    img_path = "/Users/toy/Desktop/learn/Deep learning/Driver-drowsiness-detection/app/backend/models/models/drowsy.jpeg"

    if not os.path.exists(img_path):
        print(f"❌ Image not found: {img_path}")
        return

    # Open image with PIL (same as API)
    pil_image = Image.open(img_path)

    print(f"📸 Image info: size={pil_image.size}, mode={pil_image.mode}")

    # Test with YOLO model
    try:
        yolo_model = model_loader.get_model("yolo")
        if yolo_model:
            print("\n=== Testing YOLO Model ===")
            is_drowsy, confidence, bbox, class_name, class_id = yolo_model.predict(
                pil_image
            )
            print(
                f"🎯 YOLO Result: {class_name} (Class {class_id}, Conf: {confidence:.3f}, Drowsy: {is_drowsy})"
            )
        else:
            print("❌ YOLO model not available")
    except Exception as e:
        print(f"❌ Error with YOLO model: {e}")

    # Test with detect_drowsiness method
    try:
        print("\n=== Testing detect_drowsiness method ===")
        result = model_loader.detect_drowsiness(pil_image, "yolo")
        print(f"🎯 detect_drowsiness Result:")
        print(f"   - Class: {result['class_name']} (ID: {result['class_id']})")
        print(f"   - Confidence: {result['confidence']:.3f}")
        print(f"   - Is Drowsy: {result['is_drowsy']}")
        print(f"   - Model: {result['model_used']}")
    except Exception as e:
        print(f"❌ Error with detect_drowsiness: {e}")


if __name__ == "__main__":
    test_real_model()
