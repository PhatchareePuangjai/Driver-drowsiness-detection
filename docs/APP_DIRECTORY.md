# Application Directory

## ส่วน Mobile Application และ Backend API

### โครงสร้างไฟล์

```
app/
├── android/                           # Android Mobile Application
│   ├── app/                          # Main application module
│   │   ├── src/main/
│   │   │   ├── java/com/drowsiness/
│   │   │   │   ├── MainActivity.java        # หน้าจอหลัก
│   │   │   │   ├── CameraActivity.java      # หน้าจอกล้อง
│   │   │   │   ├── DetectionService.java    # บริการตรวจจับ
│   │   │   │   └── AlertManager.java        # จัดการการแจ้งเตือน
│   │   │   ├── res/                    # Resources (layouts, images)
│   │   │   └── AndroidManifest.xml     # App configuration
│   │   ├── build.gradle               # Build configuration
│   │   └── proguard-rules.pro         # Code obfuscation rules
│   ├── gradle/                        # Gradle wrapper
│   ├── build.gradle                   # Project build config
│   └── settings.gradle                # Project settings
└── backend/                           # Backend API Server
    ├── app.py                         # Main Flask/FastAPI application
    ├── api/
    │   ├── __init__.py
    │   ├── routes.py                  # API endpoints
    │   └── inference.py               # Model inference logic
    ├── models/
    │   ├── __init__.py
    │   └── model_loader.py            # Load trained models
    ├── utils/
    │   ├── __init__.py
    │   ├── image_processing.py        # Image processing utilities
    │   └── response_formatter.py      # API response formatting
    ├── config/
    │   ├── __init__.py
    │   └── settings.py                # Configuration settings
    └── requirements.txt               # Python dependencies
```

## 📱 Android Application

### ฟีเจอร์หลัก

1. **Real-time Camera Capture**

   - ใช้ Camera2 API สำหรับการบันทึกวิดีโอ
   - ประมวลผลเฟรมแบบ Real-time

2. **Detection Service**

   - ส่งข้อมูลไปยัง Backend API
   - รับผลการตรวจจับกลับมา

3. **Alert System**
   - เสียงเตือนเมื่อตรวจพบอาการง่วง
   - การสั่นของเครื่อง (Vibration)
   - แจ้งเตือนบนหน้าจอ

### การพัฒนา Android App

```bash
cd app/android/

# เปิดโปรเจ็กต์ด้วย Android Studio
# หรือใช้ command line build
./gradlew assembleDebug

# ติดตั้งบนอุปกรณ์
./gradlew installDebug
```

### Requirements สำหรับ Android

- **Android Studio**: Arctic Fox หรือใหม่กว่า
- **Min SDK**: API Level 21 (Android 5.0)
- **Target SDK**: API Level 33 (Android 13)
- **Build Tools**: 30.0.3+

## 🖥️ Backend API Server

### ฟีเจอร์หลัก

1. **Model Inference API**

   - รับภาพจาก Mobile App
   - ประมวลผลด้วย ML Models
   - ส่งผลลัพธ์กลับ

2. **Real-time Processing**

   - WebSocket support สำหรับ Real-time communication
   - Batch processing สำหรับประสิทธิภาพ

3. **Model Management**
   - โหลดและจัดการ Multiple Models
   - Model switching และ A/B testing

### การเริ่มต้นใช้งาน Backend

```bash
cd app/backend/

# ติดตั้ง dependencies
pip install -r requirements.txt

# เริ่มเซิร์ฟเวอร์
python app.py

# หรือใช้ gunicorn สำหรับ production
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

### API Endpoints

| Method | Endpoint            | Description             |
| ------ | ------------------- | ----------------------- |
| POST   | `/api/detect`       | ตรวจจับอาการง่วงจากภาพ  |
| POST   | `/api/detect/batch` | ตรวจจับแบบ Batch        |
| GET    | `/api/health`       | ตรวจสอบสถานะเซิร์ฟเวอร์ |
| GET    | `/api/models`       | รายการโมเดลที่ใช้งานได้ |

### ตัวอย่าง API Usage

```python
import requests
import base64

# เตรียมภาพ
with open("test_image.jpg", "rb") as f:
    image_data = base64.b64encode(f.read()).decode()

# ส่งข้อมูลไป API
response = requests.post("http://localhost:8000/api/detect",
                        json={"image": image_data})

result = response.json()
print(f"Status: {result['status']}")
print(f"Confidence: {result['confidence']}")
```

## 🔧 Configuration

### Environment Variables

```bash
# Backend Configuration
export MODEL_PATH="/path/to/trained/models"
export API_HOST="0.0.0.0"
export API_PORT="8000"
export DEBUG="False"

# Database (if needed)
export DB_URL="sqlite:///drowsiness.db"
```

### Android Configuration

แก้ไขไฟล์ `app/src/main/res/values/strings.xml`:

```xml
<resources>
    <string name="app_name">Drowsiness Detection</string>
    <string name="api_base_url">http://your-server.com:8000</string>
    <string name="camera_permission_rationale">Camera permission needed for detection</string>
</resources>
```

## 🚀 การ Deploy

### Backend Deployment

```bash
# Docker deployment
docker build -t drowsiness-api .
docker run -p 8000:8000 drowsiness-api

# Or using docker-compose
docker-compose up -d
```

### Android Build & Release

```bash
# สร้าง Release APK
./gradlew assembleRelease

# สร้าง App Bundle (สำหรับ Google Play)
./gradlew bundleRelease
```

## 📊 Monitoring & Logging

- **Backend**: ใช้ logging สำหรับ debug และ monitoring
- **Android**: Firebase Analytics และ Crashlytics
- **Performance**: Monitor inference time และ accuracy

## 🔒 Security Considerations

1. **API Security**: ใช้ API Keys และ rate limiting
2. **Data Privacy**: ไม่เก็บภาพหรือวิดีโอของผู้ใช้
3. **Network Security**: ใช้ HTTPS สำหรับการสื่อสาร
