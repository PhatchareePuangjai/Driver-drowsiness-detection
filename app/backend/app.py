# Flask Backend API for Drowsiness Detection (Mock Version)

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
import numpy as np
from PIL import Image
import logging
from datetime import datetime
import os
import cv2

# Import real model components (YOLO only)
from models.real_model_loader import real_model_loader as model_loader
print("✅ Using real YOLO model")

from utils.response_formatter import ResponseFormatter
from utils.image_processing import ImageProcessor

# Helper functions for class name handling
import re


def _normalize_class_name(name: str) -> str:
    s = str(name or "").strip()
    s = re.sub(r"([a-z0-9])([A-Z])", r"\1-\2", s)
    s = s.replace("_", "-").replace(" ", "-")
    return s.lower()


def _humanize_class_name(name: str) -> str:
    # Convert CamelCase to spaced words then title-case
    s = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", str(name or "").strip())
    s = s.replace("-", " ").replace("_", " ")
    return s.lower()

# Initialize Flask app
app = Flask(__name__)

# Configure CORS to allow all origins for development
CORS(
    app,
    origins=[
        "http://localhost:8100",
        "http://127.0.0.1:8100",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    supports_credentials=False,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize components
print("🚀 Real model loader initialized")

response_formatter = ResponseFormatter()
image_processor = ImageProcessor()

# Models are loaded by the real_model_loader singleton on import
try:
    print("✅ Real models loaded from singleton instance")
except Exception as e:
    print(f"❌ Error loading real models: {e}")


@app.route("/api/health", methods=["GET"])
def health_check():
    """
    Health check endpoint
    """
    models_loaded = list(model_loader.models.keys())
    return jsonify(
        response_formatter.format_health_response(
            status="healthy",
            models_loaded=models_loaded,
            additional_info={
                "server": "Flask Development Server",
                "mode": "real",
                "version": "1.0.0",
            },
        )
    )


@app.route("/api/models", methods=["GET"])
def get_available_models():
    """Get list of available models with class information"""
    try:
        models = model_loader.get_all_models()

        # Add class information for each model
        models_with_classes = []
        for model_name in models:
            model_info = model_loader.get_model_info(model_name)
            if model_info:
                models_with_classes.append(model_info)

        return jsonify(response_formatter.format_models_response(models_with_classes))
    except Exception as e:
        return jsonify(response_formatter.format_error_response(str(e))), 500


@app.route("/api/detect", methods=["POST"])
def detect_drowsiness():
    """
    Main detection endpoint - supports both JSON and form-data

    JSON format:
    {
        "image": "base64_encoded_image",
        "model": "yolo" (optional, default: yolo),
        "sessionId": "optional_session_id",
        "confidence_threshold": 0.5 (optional)
    }

    Form-data format (from Postman):
    - image: file upload
    - model: yolo (optional, default: yolo)
    - sessionId: optional_session_id (optional)
    - confidence_threshold: 0.5 (optional)
    """
    try:
        pil_image = None
        model_name = "yolo"
        session_id = None
        confidence_threshold = 0.5

        # Check if request is form-data (multipart) or JSON
        if request.content_type and request.content_type.startswith(
            "multipart/form-data"
        ):
            # Handle form-data request (from Postman file upload)
            logger.info("Handling form-data request")

            # Get file from form
            if "image" not in request.files:
                return (
                    jsonify(
                        response_formatter.format_error_response(
                            "No image file provided in form-data"
                        )
                    ),
                    400,
                )

            file = request.files["image"]
            if file.filename == "":
                return (
                    jsonify(
                        response_formatter.format_error_response(
                            "No image file selected"
                        )
                    ),
                    400,
                )

            # Get other form parameters
            model_name = request.form.get("model", "yolo")
            session_id = request.form.get("sessionId")
            confidence_threshold = float(request.form.get("confidence_threshold", 0.5))

            # Read image file directly
            try:
                pil_image = Image.open(file.stream)
                logger.info(
                    f"Received image from form-data: {pil_image.size}, format: {pil_image.format}"
                )
            except Exception as e:
                return (
                    jsonify(
                        response_formatter.format_error_response(
                            f"Invalid image file: {str(e)}"
                        )
                    ),
                    400,
                )

        else:
            # Handle JSON request
            logger.info("Handling JSON request")
            data = request.get_json()

            if not data or "image" not in data:
                return (
                    jsonify(
                        response_formatter.format_error_response(
                            "No image data provided"
                        )
                    ),
                    400,
                )

            # Extract parameters
            image_data = data["image"]
            model_name = data.get("model", "yolo")
            session_id = data.get("sessionId")
            confidence_threshold = float(data.get("confidence_threshold", 0.5))

            # Simple validation of base64 image data
            try:
                # Remove data URL prefix if present
                if "," in image_data:
                    image_data = image_data.split(",")[1]

                # Try to decode base64
                decoded_data = base64.b64decode(image_data)

                # Try to open as PIL image
                pil_image = Image.open(io.BytesIO(decoded_data))
                logger.info(
                    f"Received image from JSON: {pil_image.size}, format: {pil_image.format}"
                )

            except Exception as e:
                return (
                    jsonify(
                        response_formatter.format_error_response(
                            f"Invalid image data format: {str(e)}"
                        )
                    ),
                    400,
                )

        # Validate model name
        available_models = ["yolo"]
        if model_name not in available_models:
            return (
                jsonify(
                    response_formatter.format_error_response(
                        f"Model {model_name} not available. Available models: {available_models}"
                    )
                ),
                400,
            )

        # Validate confidence threshold
        if confidence_threshold < 0.0 or confidence_threshold > 1.0:
            return (
                jsonify(
                    response_formatter.format_error_response(
                        "confidence_threshold must be between 0.0 and 1.0"
                    )
                ),
                400,
            )

        # Run inference using the unified method
        start_time = datetime.utcnow()

        try:
            result = model_loader.detect_drowsiness(pil_image, model_name)
            inference_time = (datetime.utcnow() - start_time).total_seconds()

            # Apply confidence threshold
            if result.get("confidence", 0) < confidence_threshold:
                result["is_drowsy"] = False
                result["class_name"] = "normal-driving"
                logger.info(
                    f"Result filtered by confidence threshold: {result.get('confidence', 0)} < {confidence_threshold}"
                )

            # Add session and timing info
            result["sessionId"] = session_id
            result["inference_time_seconds"] = round(inference_time, 3)
            result["confidence_threshold"] = confidence_threshold

            # Create alert level based on normalized class name
            cls_norm = _normalize_class_name(result["class_name"])
            cls_human = _humanize_class_name(result["class_name"])

            if result["is_drowsy"]:
                if cls_norm in ["sleepy-driving", "yawning", "sleepy", "yawn"]:
                    alert_level = "high"
                    alert_message = f"Driver is {cls_human}! Immediate attention required."
                elif cls_norm in ["dangerous-driving", "drinking"]:
                    alert_level = "critical"
                    alert_message = f"Critical: {cls_human} detected! Pull over immediately."
                else:
                    alert_level = "medium"
                    alert_message = f"Warning: {cls_human} detected. Stay alert."
            else:
                alert_level = "none"
                alert_message = f"Driver appears {cls_human}. Continue monitoring."

            result["alert_level"] = alert_level
            result["alert_message"] = alert_message

            # Save annotated image to outputs/detections
            try:
                detections_dir = os.getenv("DETECTIONS_DIR", os.path.join("outputs", "detections"))
                os.makedirs(detections_dir, exist_ok=True)

                filename = f"{model_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')}.jpg"
                save_path = os.path.join(detections_dir, filename)

                if model_name == "yolo":
                    yolo_model = model_loader.get_model("yolo")
                    img_array = np.array(pil_image)
                    yolo_results = yolo_model.model(img_array, verbose=False)
                    if yolo_results and len(yolo_results) > 0:
                        annotated = yolo_results[0].plot()  # BGR image
                        ok = cv2.imwrite(save_path, annotated)
                        if ok:
                            result["saved_image_path"] = save_path
                            logger.info(f"Saved annotated image to {save_path}")
                    else:
                        # Fallback: draw bbox if available
                        if result.get("bbox"):
                            x = int(result["bbox"].get("x", 0))
                            y = int(result["bbox"].get("y", 0))
                            w = int(result["bbox"].get("width", 0))
                            h = int(result["bbox"].get("height", 0))
                            img_bgr = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
                            cv2.rectangle(img_bgr, (x, y), (x + w, y + h), (0, 255, 0), 2)
                            ok = cv2.imwrite(save_path, img_bgr)
                            if ok:
                                result["saved_image_path"] = save_path
                                logger.info(f"Saved bbox image to {save_path}")
                else:
                    # Future models: simple bbox draw if bbox exists
                    if result.get("bbox"):
                        x = int(result["bbox"].get("x", 0))
                        y = int(result["bbox"].get("y", 0))
                        w = int(result["bbox"].get("width", 0))
                        h = int(result["bbox"].get("height", 0))
                        img_bgr = cv2.cvtColor(np.array(pil_image), cv2.COLOR_RGB2BGR)
                        cv2.rectangle(img_bgr, (x, y), (x + w, y + h), (0, 255, 0), 2)
                        ok = cv2.imwrite(save_path, img_bgr)
                        if ok:
                            result["saved_image_path"] = save_path
                            logger.info(f"Saved bbox image to {save_path}")
            except Exception as save_err:
                logger.warning(f"Failed to save annotated image: {save_err}")

            logger.info(
                f"Detection completed: {result.get('class_name', 'unknown')} (confidence: {result.get('confidence', 0):.2f})"
            )

            return jsonify(response_formatter.format_detection_response(result))

        except Exception as e:
            logger.error(f"Detection error: {str(e)}")
            return (
                jsonify(
                    response_formatter.format_error_response(
                        f"Detection failed: {str(e)}"
                    )
                ),
                500,
            )

    except Exception as e:
        logger.error(f"Error in detection: {e}")
        return (
            jsonify(response_formatter.format_error_response("Internal server error")),
            500,
        )


@app.route("/api/detect/batch", methods=["POST"])
def detect_batch():
    """
    Batch detection endpoint for multiple images

    Expected JSON:
    {
        "images": ["base64_1", "base64_2", ...],
        "model": "yolo" (optional),
        "sessionId": "optional_session_id",
        "save": true  // optional, default true; save annotated images
    }
    """
    try:
        data = request.get_json()

        if not data or "images" not in data:
            return (
                jsonify(response_formatter.format_error_response("No images data provided")),
                400,
            )

        images_data = data["images"]
        model_name = data.get("model", "yolo")
        session_id = data.get("sessionId")
        save_images = bool(data.get("save", True))

        if len(images_data) > 10:  # Limit batch size
            return (
                jsonify(
                    response_formatter.format_error_response(
                        "Batch size too large (max 10 images)"
                    )
                ),
                400,
            )

        # Validate model
        if model_loader.get_model(model_name) is None:
            return (
                jsonify(
                    response_formatter.format_error_response(
                        f"Model {model_name} not available"
                    )
                ),
                400,
            )

        # Process each image
        results = []
        start_time = datetime.utcnow()

        for i, image_data in enumerate(images_data):
            try:
                # Simple validation
                if "," in image_data:
                    image_data = image_data.split(",")[1]

                decoded_data = base64.b64decode(image_data)
                pil_image = Image.open(io.BytesIO(decoded_data))

                # Run inference via unified loader
                detection = model_loader.detect_drowsiness(pil_image, model_name)
                detection["sessionId"] = session_id

                # Optionally save annotated image (YOLO)
                if save_images and model_name == "yolo":
                    try:
                        detections_dir = os.getenv("DETECTIONS_DIR", os.path.join("outputs", "detections"))
                        os.makedirs(detections_dir, exist_ok=True)
                        filename = f"{model_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')}_{i}.jpg"
                        save_path = os.path.join(detections_dir, filename)

                        yolo_model = model_loader.get_model("yolo")
                        img_array = np.array(pil_image)
                        yolo_results = yolo_model.model(img_array, verbose=False)
                        if yolo_results and len(yolo_results) > 0:
                            annotated = yolo_results[0].plot()
                            if cv2.imwrite(save_path, annotated):
                                detection["saved_image_path"] = save_path
                    except Exception as save_err:
                        logger.warning(f"Failed to save annotated batch image {i}: {save_err}")
                # Format individual result
                result = response_formatter.format_detection_response(detection)
                result["index"] = i
                results.append(result)

            except Exception as e:
                logger.error(f"Error processing image {i}: {e}")
                error_result = response_formatter.format_error_response(
                    f"Error processing image {i}: {str(e)}"
                )
                error_result["index"] = i
                results.append(error_result)

        total_time = (datetime.utcnow() - start_time).total_seconds()

        # Format batch response
        response = response_formatter.format_batch_response(
            results=results,
            total_inference_time=total_time,
            model_used=model_name,
            session_id=session_id,
        )

        logger.info(
            f"Batch processing completed: {len(results)} images in {total_time:.2f}s"
        )

        return jsonify(response)

    except Exception as e:
        logger.error(f"Error in batch detection: {e}")
        return jsonify(response_formatter.format_error_response("Internal server error")), 500


# Session management endpoints (future implementation)
@app.route("/api/session/start", methods=["POST"])
def start_session():
    """Start a new detection session"""
    try:
        data = request.get_json() or {}
        settings = data.get("settings", {})

        # Generate session ID
        session_id = f"session_{int(datetime.utcnow().timestamp())}"

        response = response_formatter.format_session_response(
            session_id=session_id,
            action="started",
            message="Detection session started successfully",
            session_data={
                "startTime": datetime.utcnow().isoformat(),
                "settings": settings,
            },
        )

        logger.info(f"Session started: {session_id}")
        return jsonify(response)

    except Exception as e:
        logger.error(f"Error starting session: {e}")
        return (
            jsonify(response_formatter.format_error_response("Failed to start session")),
            500,
        )


@app.route("/api/session/end", methods=["POST"])
def end_session():
    """End a detection session"""
    try:
        data = request.get_json() or {}
        session_id = data.get("sessionId")

        if not session_id:
            return (
                jsonify(response_formatter.format_error_response("Session ID required")),
                400,
            )

        response = response_formatter.format_session_response(
            session_id=session_id,
            action="ended",
            message="Detection session ended successfully",
            session_data={
                "endTime": datetime.utcnow().isoformat(),
                "summary": {
                    "duration": 3600,  # Mock duration
                    "totalFrames": 150,
                    "drowsyFrames": 12,
                    "alertsTriggered": 3,
                },
            },
        )

        logger.info(f"Session ended: {session_id}")
        return jsonify(response)

    except Exception as e:
        logger.error(f"Error ending session: {e}")
        return jsonify(response_formatter.format_error_response("Failed to end session")), 500


@app.route("/api/session/history", methods=["GET"])
def get_session_history():
    """Get session history"""
    try:
        # Mock session history
        mock_sessions = [
            {
                "id": f"session_{int(datetime.utcnow().timestamp()) - i * 3600}",
                "startTime": datetime.utcnow()
                .replace(hour=datetime.utcnow().hour - i)
                .isoformat(),
                "endTime": datetime.utcnow()
                .replace(hour=datetime.utcnow().hour - i + 1)
                .isoformat(),
                "duration": 3600,
                "totalFrames": 100 + i * 20,
                "drowsyFrames": 5 + i * 2,
                "alertsTriggered": i,
                "averageConfidence": 0.75 + (i * 0.05),
            "modelUsed": "yolo",
                "isActive": False,
            }
            for i in range(5)
        ]

        response = {
            "status": "success",
            "sessions": mock_sessions,
            "totalSessions": len(mock_sessions),
            "totalDrowsyDetections": sum(s["drowsyFrames"] for s in mock_sessions),
            "timestamp": datetime.utcnow().isoformat(),
        }

        return jsonify(response)

    except Exception as e:
        logger.error(f"Error getting session history: {e}")
        return (
            jsonify(
                response_formatter.format_error_response("Failed to get session history")
            ),
            500,
        )


@app.errorhandler(404)
def not_found(error):
    return (
        jsonify(response_formatter.format_error_response("Endpoint not found", "NOT_FOUND")),
        404,
    )


@app.errorhandler(500)
def internal_error(error):
    return (
        jsonify(
            response_formatter.format_error_response(
                "Internal server error", "INTERNAL_ERROR"
            )
        ),
        500,
    )


if __name__ == "__main__":
    # Configuration
    import os

    HOST = os.getenv("API_HOST", "0.0.0.0")
    PORT = int(os.getenv("API_PORT", 8000))
    DEBUG = os.getenv("DEBUG", "True").lower() == "true"

    logger.info("🚀 Starting Drowsiness Detection API (Real YOLO Mode)")
    logger.info(f"📍 Server: http://{HOST}:{PORT}")
    logger.info(f"🔧 Debug mode: {DEBUG}")

    logger.info(f"🤖 Models loaded: {len(model_loader.models)}")
    logger.info(f"📋 Available models: {list(model_loader.models.keys())}")

    app.run(host=HOST, port=PORT, debug=DEBUG)
