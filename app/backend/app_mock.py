# Flask Backend API for Drowsiness Detection (Mock Version)

from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import io
import numpy as np
from PIL import Image
import logging
from datetime import datetime

# Import mock components (no heavy ML dependencies)
from models.model_loader import model_loader
from utils.response_formatter import ResponseFormatter

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for mobile app communication

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize components
response_formatter = ResponseFormatter()


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    models_info = model_loader.get_all_models()
    return jsonify(
        response_formatter.format_health_response(
            status="healthy",
            models_loaded=models_info,
            additional_info={
                "server": "Flask Development Server",
                "mode": "mock_data",
                "version": "1.0.0",
                "supported_classes": 7,
            },
        )
    )


@app.route("/api/models", methods=["GET"])
def get_available_models():
    """Get list of available models with class information"""
    try:
        models = model_loader.get_all_models()

        # Add class information for each model
        models_with_classes = {}
        for model_name in models:
            model_info = model_loader.get_model_info(model_name)
            models_with_classes[model_name] = model_info

        return jsonify(response_formatter.format_models_response(models_with_classes))
    except Exception as e:
        return jsonify(response_formatter.format_error_response(str(e))), 500


@app.route("/api/detect", methods=["POST"])
def detect_drowsiness():
    """
    Main detection endpoint
    Expected JSON: {
        "image": "base64_encoded_image",
        "model": "yolo|faster_rcnn|vgg16" (optional, default: yolo),
        "sessionId": "optional_session_id"
    }
    """
    try:
        # Get request data
        data = request.get_json()

        if not data or "image" not in data:
            return (
                jsonify(
                    response_formatter.format_error_response("No image data provided")
                ),
                400,
            )

        # Extract parameters
        image_data = data["image"]
        model_name = data.get("model", "yolo")
        session_id = data.get("sessionId")

        # Validate model name
        available_models = ["yolo", "faster_rcnn", "vgg16"]
        if model_name not in available_models:
            return (
                jsonify(
                    response_formatter.format_error_response(
                        f"Model {model_name} not available. Available models: {available_models}"
                    )
                ),
                400,
            )

        # Simple validation of base64 image data
        try:
            # Remove data URL prefix if present
            if "," in image_data:
                image_data = image_data.split(",")[1]

            # Try to decode base64
            decoded_data = base64.b64decode(image_data)

            # Try to open as PIL image
            pil_image = Image.open(io.BytesIO(decoded_data))
            logger.info(f"Received image: {pil_image.size}, format: {pil_image.format}")

        except Exception as e:
            return (
                jsonify(
                    response_formatter.format_error_response(
                        "Invalid image data format"
                    )
                ),
                400,
            )

        # Run mock inference using the unified method
        start_time = datetime.utcnow()

        try:
            result = model_loader.detect_drowsiness(pil_image, model_name)
            inference_time = (datetime.utcnow() - start_time).total_seconds()

            # Add session and timing info
            result["sessionId"] = session_id
            result["inference_time_seconds"] = round(inference_time, 3)

            # Create alert level based on class
            if result["is_drowsy"]:
                if result["class_name"] in ["SleepyDriving", "Yawn"]:
                    alert_level = "high"
                    alert_message = f"Driver is {result['class_name'].lower()}! Immediate attention required."
                elif result["class_name"] in ["DangerousDriving", "Drinking"]:
                    alert_level = "critical"
                    alert_message = f"Critical: {result['class_name']} detected! Pull over immediately."
                else:
                    alert_level = "medium"
                    alert_message = (
                        f"Warning: {result['class_name']} detected. Stay alert."
                    )
            else:
                alert_level = "none"
                alert_message = f"Driver appears {result['class_name'].lower().replace('-', ' ')}. Continue monitoring."

            result["alert_level"] = alert_level
            result["alert_message"] = alert_message

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
    Expected JSON: {
        "images": ["base64_1", "base64_2", ...],
        "model": "yolo|faster_rcnn|vgg16" (optional),
        "sessionId": "optional_session_id"
    }
    """
    try:
        data = request.get_json()

        if not data or "images" not in data:
            return (
                jsonify(
                    response_formatter.format_error_response("No images data provided")
                ),
                400,
            )

        images_data = data["images"]
        model_name = data.get("model", "yolo")
        session_id = data.get("sessionId")

        if len(images_data) > 10:  # Limit batch size
            return (
                jsonify(
                    response_formatter.format_error_response(
                        "Batch size too large (max 10 images)"
                    )
                ),
                400,
            )

        # Validate model name
        available_models = ["yolo", "faster_rcnn", "vgg16"]
        if model_name not in available_models:
            return (
                jsonify(
                    response_formatter.format_error_response(
                        f"Model {model_name} not available. Available models: {available_models}"
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

                # Run inference using unified method
                result = model_loader.detect_drowsiness(pil_image, model_name)

                # Add batch-specific info
                result["index"] = i
                result["sessionId"] = session_id

                # Add alert level based on class
                if result["is_drowsy"]:
                    if result["class_name"] in ["SleepyDriving", "Yawn"]:
                        alert_level = "high"
                        alert_message = f"Driver is {result['class_name'].lower()}! Immediate attention required."
                    elif result["class_name"] in ["DangerousDriving", "Drinking"]:
                        alert_level = "critical"
                        alert_message = f"Critical: {result['class_name']} detected! Pull over immediately."
                    else:
                        alert_level = "medium"
                        alert_message = (
                            f"Warning: {result['class_name']} detected. Stay alert."
                        )
                else:
                    alert_level = "none"
                    alert_message = f"Driver appears {result['class_name'].lower().replace('-', ' ')}. Continue monitoring."

                result["alert_level"] = alert_level
                result["alert_message"] = alert_message

                # Format the result for consistency
                formatted_result = response_formatter.format_detection_response(result)
                formatted_result["index"] = i
                results.append(formatted_result)

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
        return (
            jsonify(response_formatter.format_error_response("Internal server error")),
            500,
        )


# Session management endpoints (mock implementation)
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
            jsonify(
                response_formatter.format_error_response("Failed to start session")
            ),
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
                jsonify(
                    response_formatter.format_error_response("Session ID required")
                ),
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
        return (
            jsonify(response_formatter.format_error_response("Failed to end session")),
            500,
        )


@app.route("/api/session/history", methods=["GET"])
def get_session_history():
    """Get session history (mock data)"""
    try:
        # Mock session history
        mock_sessions = [
            {
                "id": f"session_{int(datetime.utcnow().timestamp()) - i * 3600}",
                "startTime": datetime.utcnow()
                .replace(hour=max(0, datetime.utcnow().hour - i))
                .isoformat(),
                "endTime": datetime.utcnow()
                .replace(hour=min(23, datetime.utcnow().hour - i + 1))
                .isoformat(),
                "duration": 3600,
                "totalFrames": 100 + i * 20,
                "drowsyFrames": 5 + i * 2,
                "alertsTriggered": i,
                "averageConfidence": round(0.75 + (i * 0.05), 3),
                "modelUsed": ["yolo", "faster_rcnn", "vgg16"][i % 3],
                "isActive": False,
                "settings": {
                    "model": ["yolo", "faster_rcnn", "vgg16"][i % 3],
                    "confidenceThreshold": 0.5,
                    "frameInterval": 500,
                    "autoStart": True,
                    "enablePreprocessing": True,
                },
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
                response_formatter.format_error_response(
                    "Failed to get session history"
                )
            ),
            500,
        )


@app.errorhandler(404)
def not_found(error):
    return (
        jsonify(
            response_formatter.format_error_response("Endpoint not found", "NOT_FOUND")
        ),
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

    logger.info("=" * 60)
    logger.info("🚀 Drowsiness Detection API (Mock Mode)")
    logger.info("=" * 60)
    logger.info(f"📍 Server: http://{HOST}:{PORT}")
    logger.info(f"🔧 Debug mode: {DEBUG}")
    logger.info(f"🤖 Models loaded: {len(model_loader.get_all_models())}")
    logger.info(f"📋 Available endpoints:")
    logger.info(f"   • GET  /api/health")
    logger.info(f"   • GET  /api/models")
    logger.info(f"   • POST /api/detect")
    logger.info(f"   • POST /api/detect/batch")
    logger.info(f"   • POST /api/session/start")
    logger.info(f"   • POST /api/session/end")
    logger.info(f"   • GET  /api/session/history")
    logger.info("=" * 60)

    app.run(host=HOST, port=PORT, debug=DEBUG)
