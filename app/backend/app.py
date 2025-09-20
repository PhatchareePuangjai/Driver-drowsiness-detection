# Flask Backend API for Drowsiness Detection

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
import cv2
import numpy as np
from PIL import Image
import torch
import logging
from datetime import datetime

# Import model classes (จะต้องสร้างไฟล์เหล่านี้)
from models.model_loader import ModelLoader
from utils.image_processing import ImageProcessor
from utils.response_formatter import ResponseFormatter

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for mobile app communication

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize components
model_loader = ModelLoader()
image_processor = ImageProcessor()
response_formatter = ResponseFormatter()

# Load models on startup
try:
    model_loader.load_all_models()
    logger.info("All models loaded successfully")
except Exception as e:
    logger.error(f"Error loading models: {e}")


@app.route("/api/health", methods=["GET"])
def health_check():
    """
    Health check endpoint
    """
    return jsonify(
        {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "models_loaded": model_loader.get_loaded_models(),
        }
    )


@app.route("/api/models", methods=["GET"])
def get_available_models():
    """
    Get list of available models
    """
    models = model_loader.get_model_info()
    return jsonify({"status": "success", "models": models})


@app.route("/api/detect", methods=["POST"])
def detect_drowsiness():
    """
    Main detection endpoint

    Expected JSON:
    {
        "image": "base64_encoded_image",
        "model": "yolo|faster_rcnn|vgg16" (optional, default: yolo)
    }
    """
    try:
        # Get request data
        data = request.get_json()

        if not data or "image" not in data:
            return (
                jsonify({"status": "error", "message": "No image data provided"}),
                400,
            )

        # Decode base64 image
        image_data = data["image"]
        model_name = data.get("model", "yolo")

        # Convert base64 to image
        image = image_processor.decode_base64_image(image_data)

        if image is None:
            return jsonify({"status": "error", "message": "Invalid image data"}), 400

        # Get selected model
        model = model_loader.get_model(model_name)

        if model is None:
            return (
                jsonify(
                    {"status": "error", "message": f"Model {model_name} not available"}
                ),
                400,
            )

        # Preprocess image
        processed_image = image_processor.preprocess_for_model(image, model_name)

        # Run inference
        start_time = datetime.utcnow()

        if model_name == "yolo":
            is_drowsy, confidence, bbox = model.detect_drowsiness(image)
        elif model_name == "faster_rcnn":
            is_drowsy, confidence, bbox = model.predict(processed_image)
        elif model_name == "vgg16":
            is_drowsy, confidence = model.classify(processed_image)
            bbox = None
        else:
            return (
                jsonify({"status": "error", "message": "Unsupported model type"}),
                400,
            )

        inference_time = (datetime.utcnow() - start_time).total_seconds()

        # Format response
        response = response_formatter.format_detection_response(
            is_drowsy=is_drowsy,
            confidence=confidence,
            bbox=bbox,
            model_used=model_name,
            inference_time=inference_time,
        )

        logger.info(
            f"Detection completed: {response['status']} (confidence: {confidence:.2f})"
        )

        return jsonify(response)

    except Exception as e:
        logger.error(f"Error in detection: {e}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500


@app.route("/api/detect/batch", methods=["POST"])
def detect_batch():
    """
    Batch detection endpoint for multiple images

    Expected JSON:
    {
        "images": ["base64_1", "base64_2", ...],
        "model": "yolo|faster_rcnn|vgg16" (optional)
    }
    """
    try:
        data = request.get_json()

        if not data or "images" not in data:
            return (
                jsonify({"status": "error", "message": "No images data provided"}),
                400,
            )

        images_data = data["images"]
        model_name = data.get("model", "yolo")

        if len(images_data) > 10:  # Limit batch size
            return (
                jsonify(
                    {
                        "status": "error",
                        "message": "Batch size too large (max 10 images)",
                    }
                ),
                400,
            )

        # Get model
        model = model_loader.get_model(model_name)

        if model is None:
            return (
                jsonify(
                    {"status": "error", "message": f"Model {model_name} not available"}
                ),
                400,
            )

        # Process each image
        results = []
        start_time = datetime.utcnow()

        for i, image_data in enumerate(images_data):
            try:
                # Decode and process image
                image = image_processor.decode_base64_image(image_data)

                if image is None:
                    results.append(
                        {"index": i, "status": "error", "message": "Invalid image data"}
                    )
                    continue

                # Run inference
                if model_name == "yolo":
                    is_drowsy, confidence, bbox = model.detect_drowsiness(image)
                elif model_name == "faster_rcnn":
                    processed_image = image_processor.preprocess_for_model(
                        image, model_name
                    )
                    is_drowsy, confidence, bbox = model.predict(processed_image)
                elif model_name == "vgg16":
                    processed_image = image_processor.preprocess_for_model(
                        image, model_name
                    )
                    is_drowsy, confidence = model.classify(processed_image)
                    bbox = None

                # Add result
                result = response_formatter.format_detection_response(
                    is_drowsy=is_drowsy,
                    confidence=confidence,
                    bbox=bbox,
                    model_used=model_name,
                    inference_time=0,  # Will calculate total time below
                )
                result["index"] = i
                results.append(result)

            except Exception as e:
                logger.error(f"Error processing image {i}: {e}")
                results.append({"index": i, "status": "error", "message": str(e)})

        total_time = (datetime.utcnow() - start_time).total_seconds()

        return jsonify(
            {
                "status": "success",
                "results": results,
                "total_inference_time": total_time,
                "model_used": model_name,
            }
        )

    except Exception as e:
        logger.error(f"Error in batch detection: {e}")
        return jsonify({"status": "error", "message": "Internal server error"}), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({"status": "error", "message": "Endpoint not found"}), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"status": "error", "message": "Internal server error"}), 500


if __name__ == "__main__":
    # Configuration
    import os

    HOST = os.getenv("API_HOST", "0.0.0.0")
    PORT = int(os.getenv("API_PORT", 8000))
    DEBUG = os.getenv("DEBUG", "False").lower() == "true"

    logger.info(f"Starting Drowsiness Detection API on {HOST}:{PORT}")
    logger.info(f"Debug mode: {DEBUG}")

    app.run(host=HOST, port=PORT, debug=DEBUG)
