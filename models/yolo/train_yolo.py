# YOLO Implementation for Drowsiness Detection

import torch
import torch.nn as nn
from ultralytics import YOLO
import cv2
import numpy as np


class DrowsinessYOLO:
    def __init__(self, model_path="yolov8n.pt"):
        """
        Initialize YOLO model for drowsiness detection

        Args:
            model_path (str): Path to YOLO model weights
        """
        self.model = YOLO(model_path)
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    def train(self, data_config, epochs=100, img_size=640):
        """
        Train YOLO model for drowsiness detection

        Args:
            data_config (str): Path to dataset configuration file
            epochs (int): Number of training epochs
            img_size (int): Input image size
        """
        results = self.model.train(
            data=data_config, epochs=epochs, imgsz=img_size, device=self.device
        )
        return results

    def predict(self, source, save=False):
        """
        Predict drowsiness from image/video source

        Args:
            source: Image path, video path, or camera index
            save (bool): Whether to save results

        Returns:
            results: Detection results
        """
        results = self.model.predict(source=source, save=save, device=self.device)
        return results

    def detect_drowsiness(self, frame):
        """
        Detect drowsiness in a single frame

        Args:
            frame: Input image frame

        Returns:
            bool: True if drowsy, False if alert
            float: Confidence score
        """
        results = self.model(frame)

        # Process results
        for result in results:
            if result.boxes is not None:
                # Get class predictions and confidence scores
                classes = result.boxes.cls.cpu().numpy()
                confidences = result.boxes.conf.cpu().numpy()

                # Check if drowsy class is detected
                for cls, conf in zip(classes, confidences):
                    if cls == 1 and conf > 0.5:  # Class 1 = Drowsy
                        return True, conf

        return False, 0.0


if __name__ == "__main__":
    # Example usage
    detector = DrowsinessYOLO()

    # For training
    # detector.train(data_config='../data/dataset.yaml', epochs=100)

    # For real-time detection
    cap = cv2.VideoCapture(0)

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        is_drowsy, confidence = detector.detect_drowsiness(frame)

        # Display result
        status = "DROWSY" if is_drowsy else "ALERT"
        color = (0, 0, 255) if is_drowsy else (0, 255, 0)

        cv2.putText(
            frame,
            f"{status}: {confidence:.2f}",
            (10, 30),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            color,
            2,
        )

        cv2.imshow("Drowsiness Detection", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()
