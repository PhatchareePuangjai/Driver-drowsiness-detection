#!/usr/bin/env python3
"""
API Integration Test Script
Tests Camera Service integration with Flask backend
"""

import requests
import json
import base64
import time
from io import BytesIO
from PIL import Image, ImageDraw


def create_test_image():
    """Create a simple test image as base64"""
    # Create a simple 640x480 test image
    img = Image.new("RGB", (640, 480), color="lightblue")
    draw = ImageDraw.Draw(img)

    # Draw a simple face-like shape for testing
    draw.ellipse([200, 150, 440, 330], fill="yellow", outline="black", width=3)  # Face
    draw.ellipse([250, 200, 290, 230], fill="black")  # Left eye
    draw.ellipse([350, 200, 390, 230], fill="black")  # Right eye
    draw.arc([280, 250, 360, 300], 0, 180, fill="black", width=3)  # Smile

    # Convert to base64
    buffer = BytesIO()
    img.save(buffer, format="JPEG", quality=80)
    img_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    return img_base64


def test_api_endpoints():
    """Test all API endpoints"""
    base_url = "http://127.0.0.1:8000/api"

    print("🧪 Testing Driver Drowsiness Detection API")
    print("=" * 50)

    # Test 1: Health Check
    print("\n1️⃣ Testing Health Check...")
    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Health Check: {health_data}")
        else:
            print(f"❌ Health Check failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Health Check error: {e}")
        return False

    # Test 2: Models List
    print("\n2️⃣ Testing Models List...")
    try:
        response = requests.get(f"{base_url}/models", timeout=5)
        if response.status_code == 200:
            models_data = response.json()
            print(f"✅ Models: {json.dumps(models_data, indent=2)}")
        else:
            print(f"❌ Models request failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Models error: {e}")

    # Test 3: Single Detection (YOLO)
    print("\n3️⃣ Testing Single Detection (YOLO)...")
    test_image = create_test_image()

    detection_payload = {
        "image": test_image,
        "model": "yolo",
        "sessionId": "test_session_001",
    }

    try:
        start_time = time.time()
        response = requests.post(
            f"{base_url}/detect", json=detection_payload, timeout=10
        )
        end_time = time.time()

        if response.status_code == 200:
            detection_result = response.json()
            print(f"✅ Detection Result:")
            print(f"   • Drowsy: {detection_result.get('isDrowsy', 'N/A')}")
            print(f"   • Confidence: {detection_result.get('confidence', 'N/A')}")
            print(f"   • Model: {detection_result.get('modelUsed', 'N/A')}")
            print(f"   • Response Time: {end_time - start_time:.2f}s")
            print(f"   • Full Result: {json.dumps(detection_result, indent=2)}")
        else:
            print(f"❌ Detection failed: {response.status_code}")
            print(f"   Response: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Detection error: {e}")

    # Test 4: Single Detection (Faster R-CNN)
    print("\n4️⃣ Testing Single Detection (Faster R-CNN)...")
    detection_payload["model"] = "faster_rcnn"

    try:
        start_time = time.time()
        response = requests.post(
            f"{base_url}/detect", json=detection_payload, timeout=15
        )
        end_time = time.time()

        if response.status_code == 200:
            detection_result = response.json()
            print(f"✅ Faster R-CNN Result:")
            print(f"   • Drowsy: {detection_result.get('isDrowsy', 'N/A')}")
            print(f"   • Confidence: {detection_result.get('confidence', 'N/A')}")
            print(f"   • Response Time: {end_time - start_time:.2f}s")
        else:
            print(f"❌ Faster R-CNN detection failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Faster R-CNN detection error: {e}")

    # Test 5: Batch Detection
    print("\n5️⃣ Testing Batch Detection...")
    batch_payload = {
        "images": [test_image, test_image],  # Test with 2 images
        "model": "yolo",
        "sessionId": "test_batch_session",
    }

    try:
        start_time = time.time()
        response = requests.post(
            f"{base_url}/detect/batch", json=batch_payload, timeout=20
        )
        end_time = time.time()

        if response.status_code == 200:
            batch_result = response.json()
            print(f"✅ Batch Detection Result:")
            print(f"   • Total Results: {len(batch_result.get('results', []))}")
            print(f"   • Total Time: {end_time - start_time:.2f}s")
            print(f"   • Model Used: {batch_result.get('model_used', 'N/A')}")

            for i, result in enumerate(batch_result.get("results", [])):
                print(
                    f"   • Image {i+1}: Drowsy={result.get('isDrowsy', 'N/A')}, "
                    f"Confidence={result.get('confidence', 'N/A')}"
                )
        else:
            print(f"❌ Batch detection failed: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"❌ Batch detection error: {e}")

    print("\n🎯 API Testing Complete!")
    return True


def test_camera_service_simulation():
    """Simulate Camera Service behavior"""
    print("\n📸 Simulating Camera Service Integration...")
    print("=" * 50)

    # Simulate continuous capture (like Camera Service would do)
    test_image = create_test_image()
    session_id = f"camera_sim_{int(time.time())}"

    for i in range(3):  # Simulate 3 captures
        print(f"\n📷 Capture {i+1}/3...")

        payload = {"image": test_image, "model": "yolo", "sessionId": session_id}

        try:
            start_time = time.time()
            response = requests.post(
                "http://127.0.0.1:8000/api/detect", json=payload, timeout=10
            )
            end_time = time.time()

            if response.status_code == 200:
                result = response.json()
                is_drowsy = result.get("isDrowsy", False)
                confidence = result.get("confidence", 0)

                # Simulate alert logic (like Camera Service)
                alert_level = 0
                if is_drowsy:
                    if confidence >= 0.8:
                        alert_level = 3  # High alert
                    elif confidence >= 0.6:
                        alert_level = 2  # Medium alert
                    elif confidence >= 0.4:
                        alert_level = 1  # Low alert

                status = "🚨 DROWSY" if is_drowsy else "✅ ALERT"
                print(
                    f"   {status} | Confidence: {confidence:.1%} | Alert Level: {alert_level} | Time: {(end_time-start_time)*1000:.0f}ms"
                )

                if alert_level >= 2:
                    print(
                        f"   🚨 ALERT TRIGGERED! Driver appears drowsy (confidence: {confidence:.1%})"
                    )
            else:
                print(f"   ❌ API Error: {response.status_code}")

        except requests.exceptions.RequestException as e:
            print(f"   ❌ Connection Error: {e}")

        # Simulate Camera Service interval (2 seconds)
        if i < 2:  # Don't sleep after last iteration
            print("   ⏳ Waiting 2 seconds (Camera Service interval)...")
            time.sleep(2)

    print("\n✅ Camera Service Simulation Complete!")


if __name__ == "__main__":
    print("🚀 Starting API Integration Tests...")

    # Test basic API functionality
    if test_api_endpoints():
        # Simulate Camera Service behavior
        test_camera_service_simulation()
    else:
        print("❌ Basic API tests failed. Please check if Flask backend is running.")
        print("   Run: python app_mock.py")
