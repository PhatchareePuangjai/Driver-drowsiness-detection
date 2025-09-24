# Response Formatter
# Standardizes API response formats for consistency

import uuid
from datetime import datetime
from typing import Dict, Any, Optional, List
import logging

logger = logging.getLogger(__name__)


class ResponseFormatter:
    """Formats API responses in a consistent structure"""

    def __init__(self):
        self.default_confidence_threshold = 0.5

    def format_detection_response(
        self,
        is_drowsy: bool,
        confidence: float,
        bbox: Optional[Dict] = None,
        model_used: str = "yolo",
        inference_time: float = 0.0,
        session_id: Optional[str] = None,
        additional_data: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Format detection result response

        Args:
            is_drowsy: Whether drowsiness was detected
            confidence: Confidence score (0.0 to 1.0)
            bbox: Bounding box coordinates {x, y, width, height}
            model_used: Name of the model used
            inference_time: Time taken for inference in seconds
            session_id: Optional session ID
            additional_data: Any additional data to include

        Returns:
            Formatted response dictionary
        """
        try:
            # Generate unique ID for this detection
            detection_id = f"{model_used}_{int(datetime.utcnow().timestamp() * 1000)}"

            # Determine if alert should be triggered
            alert_triggered = is_drowsy and confidence > 0.7

            response = {
                "id": detection_id,
                "timestamp": datetime.utcnow().isoformat(),
                "isDrowsy": is_drowsy,
                "confidence": round(confidence, 3),
                "modelUsed": model_used,
                "inferenceTime": round(inference_time, 3),
                "alertTriggered": alert_triggered,
                "status": "success",
            }

            # Add bounding box if provided
            if bbox is not None:
                response["bbox"] = {
                    "x": int(bbox.get("x", 0)),
                    "y": int(bbox.get("y", 0)),
                    "width": int(bbox.get("width", 0)),
                    "height": int(bbox.get("height", 0)),
                }

            # Add session ID if provided
            if session_id:
                response["sessionId"] = session_id

            # Add any additional data
            if additional_data:
                response.update(additional_data)

            return response

        except Exception as e:
            logger.error(f"Error formatting detection response: {e}")
            return self._error_response("Failed to format detection response")

    def format_batch_response(
        self,
        results: List[Dict],
        total_inference_time: float,
        model_used: str = "yolo",
        session_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Format batch detection response

        Args:
            results: List of individual detection results
            total_inference_time: Total time for batch processing
            model_used: Name of the model used
            session_id: Optional session ID

        Returns:
            Formatted batch response
        """
        try:
            # Calculate summary statistics
            total_detections = len(results)
            drowsy_detections = sum(1 for r in results if r.get("isDrowsy", False))
            avg_confidence = 0.0

            if total_detections > 0:
                confidences = [r.get("confidence", 0.0) for r in results]
                avg_confidence = sum(confidences) / len(confidences)

            response = {
                "status": "success",
                "results": results,
                "summary": {
                    "totalDetections": total_detections,
                    "drowsyDetections": drowsy_detections,
                    "alertRate": round(drowsy_detections / max(total_detections, 1), 3),
                    "averageConfidence": round(avg_confidence, 3),
                },
                "totalInferenceTime": round(total_inference_time, 3),
                "modelUsed": model_used,
                "timestamp": datetime.utcnow().isoformat(),
            }

            if session_id:
                response["sessionId"] = session_id

            return response

        except Exception as e:
            logger.error(f"Error formatting batch response: {e}")
            return self._error_response("Failed to format batch response")

    def format_health_response(
        self,
        status: str = "healthy",
        models_loaded: Optional[List[str]] = None,
        additional_info: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Format health check response

        Args:
            status: Health status string
            models_loaded: List of loaded model names
            additional_info: Additional system information

        Returns:
            Formatted health response
        """
        try:
            response = {
                "status": status,
                "timestamp": datetime.utcnow().isoformat(),
                "modelsLoaded": models_loaded or [],
            }

            if additional_info:
                response.update(additional_info)

            return response

        except Exception as e:
            logger.error(f"Error formatting health response: {e}")
            return self._error_response("Failed to format health response")

    def format_models_response(
        self, models: List[Dict], additional_info: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Format models list response

        Args:
            models: List of model information dictionaries
            additional_info: Additional information to include

        Returns:
            Formatted models response
        """
        try:
            response = {
                "status": "success",
                "models": models,
                "totalModels": len(models),
                "timestamp": datetime.utcnow().isoformat(),
            }

            if additional_info:
                response.update(additional_info)

            return response

        except Exception as e:
            logger.error(f"Error formatting models response: {e}")
            return self._error_response("Failed to format models response")

    def format_session_response(
        self,
        session_id: str,
        action: str,  # "started", "ended", "updated"
        status: str = "success",
        session_data: Optional[Dict] = None,
        message: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Format session management response

        Args:
            session_id: Session identifier
            action: Action performed on session
            status: Operation status
            session_data: Session information
            message: Optional message

        Returns:
            Formatted session response
        """
        try:
            response = {
                "status": status,
                "sessionId": session_id,
                "action": action,
                "timestamp": datetime.utcnow().isoformat(),
            }

            if message:
                response["message"] = message

            if session_data:
                response["sessionData"] = session_data

            return response

        except Exception as e:
            logger.error(f"Error formatting session response: {e}")
            return self._error_response("Failed to format session response")

    def _error_response(
        self,
        message: str,
        error_code: Optional[str] = None,
        details: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        """
        Format error response

        Args:
            message: Error message
            error_code: Optional error code
            details: Optional error details

        Returns:
            Formatted error response
        """
        response = {
            "status": "error",
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }

        if error_code:
            response["errorCode"] = error_code

        if details:
            response["details"] = details

        return response

    def format_validation_error(
        self, field: str, message: str, received_value: Any = None
    ) -> Dict[str, Any]:
        """
        Format validation error response

        Args:
            field: Field that failed validation
            message: Validation error message
            received_value: The value that was received

        Returns:
            Formatted validation error response
        """
        details = {"field": field, "validationMessage": message}

        if received_value is not None:
            details["receivedValue"] = str(received_value)

        return self._error_response(
            f"Validation error in field '{field}': {message}",
            error_code="VALIDATION_ERROR",
            details=details,
        )

    def format_success_response(
        self, message: str, data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Format generic success response

        Args:
            message: Success message
            data: Optional data to include

        Returns:
            Formatted success response
        """
        response = {
            "status": "success",
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
        }

        if data:
            response["data"] = data

        return response

    def add_metadata(
        self, response: Dict[str, Any], metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Add metadata to an existing response

        Args:
            response: Existing response dictionary
            metadata: Metadata to add

        Returns:
            Response with added metadata
        """
        if "metadata" not in response:
            response["metadata"] = {}

        response["metadata"].update(metadata)
        return response

    def get_response_template(self, response_type: str) -> Dict[str, Any]:
        """
        Get a response template for a specific type

        Args:
            response_type: Type of response template

        Returns:
            Response template dictionary
        """
        templates = {
            "detection": {
                "id": "",
                "timestamp": "",
                "isDrowsy": False,
                "confidence": 0.0,
                "modelUsed": "",
                "inferenceTime": 0.0,
                "alertTriggered": False,
                "status": "success",
            },
            "health": {"status": "healthy", "timestamp": "", "modelsLoaded": []},
            "error": {"status": "error", "message": "", "timestamp": ""},
        }

        return templates.get(response_type, {})
