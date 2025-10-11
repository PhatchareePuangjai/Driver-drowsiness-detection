# Driver Drowsiness Detection Backend API

Flask-based REST API สำหรับระบบตรวจจับอาการง่วงนอนขณะขับขี่ รองรับ ML models หลายตัว (YOLO, Faster R-CNN, VGG16) พร้อม Mock Data สำหรับการพัฒนา

## 🚀 Quick Start

### Prerequisites

- Python 3.8+
- pip

### Installation & Setup

```bash
# 1. Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # macOS/Linux
# หรือ .venv\Scripts\activate  # Windows

# 2. Install dependencies
pip install Flask Flask-CORS Pillow python-dotenv

# 3. Run development server
python app_mock.py
```

Server จะรันที่: **http://localhost:8000**

---

## 📋 API Endpoints Documentation

### Base URL: `http://localhost:8000`

---

### 1. 🏥 Health Check

```http
GET /api/health
```

**Description:** ตรวจสอบสถานะของ backend server และ ML models

**Response:**

```json
{
  "status": "healthy",
  "timestamp": "2025-09-24T10:30:00.000Z",
  "modelsLoaded": ["yolo", "faster_rcnn", "vgg16"],
  "server": "Flask Development Server",
  "mode": "mock_data",
  "version": "1.0.0"
}
```

---

### 2. 🤖 Get Available Models

```http
GET /api/models
```

**Description:** ขอรายชื่อและข้อมูล ML models ที่พร้อมใช้งาน

**Response:**

```json
{
  "status": "success",
  "totalModels": 3,
  "timestamp": "2025-09-24T10:30:00.000Z",
  "models": [
    {
      "name": "yolo",
      "displayName": "YOLOv8 Object Detection",
      "description": "Fast real-time object detection optimized for mobile devices",
      "accuracy": 0.87,
      "speed": "fast",
      "memoryUsage": "medium",
      "isAvailable": true
    },
    {
      "name": "faster_rcnn",
      "displayName": "Faster R-CNN",
      "description": "High accuracy object detection with region proposals",
      "accuracy": 0.91,
      "speed": "slow",
      "memoryUsage": "high",
      "isAvailable": true
    },
    {
      "name": "vgg16",
      "displayName": "VGG16 Classifier",
      "description": "Deep CNN for binary drowsiness classification",
      "accuracy": 0.83,
      "speed": "medium",
      "memoryUsage": "low",
      "isAvailable": true
    }
  ]
}
```

---

### 3. 🔍 Single Image Detection

```http
POST /api/detect
```

**Description:** ตรวจจับอาการง่วงนอนจากรูปภาพเดี่ยว

**Request Headers:**

```
Content-Type: application/json
```

**Request Body:**

```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
  "model": "yolo", // optional: "yolo" | "faster_rcnn" | "vgg16"
  "sessionId": "session_123" // optional
}
```

**Response (Alert):**

```json
{
  "id": "yolo_1727172600000",
  "timestamp": "2025-09-24T10:30:00.000Z",
  "isDrowsy": false,
  "confidence": 0.234,
  "modelUsed": "yolo",
  "inferenceTime": 0.342,
  "alertTriggered": false,
  "sessionId": "session_123",
  "status": "success",
  "bbox": {
    "x": 120,
    "y": 80,
    "width": 150,
    "height": 200
  }
}
```

**Response (Drowsy Detected):**

```json
{
  "id": "yolo_1727172600000",
  "timestamp": "2025-09-24T10:30:00.000Z",
  "isDrowsy": true,
  "confidence": 0.876,
  "modelUsed": "yolo",
  "inferenceTime": 0.234,
  "alertTriggered": true,
  "sessionId": "session_123",
  "status": "success",
  "bbox": {
    "x": 100,
    "y": 100,
    "width": 200,
    "height": 200
  }
}
```

---

### 4. 📊 Batch Image Detection

```http
POST /api/detect/batch
```

**Description:** ตรวจจับอาการง่วงนอนจากหลายรูปภาพพร้อมกัน (สูงสุด 10 รูป)

**Request Body:**

```json
{
  "images": [
    "data:image/jpeg;base64,/9j/4AAQ...",
    "data:image/jpeg;base64,/9j/4AAQ...",
    "data:image/jpeg;base64,/9j/4AAQ..."
  ],
  "model": "faster_rcnn", // optional
  "sessionId": "batch_session_456" // optional
}
```

**Response:**

```json
{
  "status": "success",
  "results": [
    {
      "index": 0,
      "id": "faster_rcnn_1727172600001",
      "timestamp": "2025-09-24T10:30:00.000Z",
      "isDrowsy": true,
      "confidence": 0.912,
      "modelUsed": "faster_rcnn",
      "inferenceTime": 0,
      "alertTriggered": true,
      "sessionId": "batch_session_456",
      "status": "success",
      "bbox": {
        "x": 95,
        "y": 110,
        "width": 180,
        "height": 220
      }
    },
    {
      "index": 1,
      "id": "faster_rcnn_1727172600002",
      "timestamp": "2025-09-24T10:30:00.000Z",
      "isDrowsy": false,
      "confidence": 0.156,
      "modelUsed": "faster_rcnn",
      "inferenceTime": 0,
      "alertTriggered": false,
      "sessionId": "batch_session_456",
      "status": "success"
    }
  ],
  "summary": {
    "totalDetections": 2,
    "drowsyDetections": 1,
    "alertRate": 0.5,
    "averageConfidence": 0.534
  },
  "totalInferenceTime": 1.234,
  "modelUsed": "faster_rcnn",
  "timestamp": "2025-09-24T10:30:00.000Z",
  "sessionId": "batch_session_456"
}
```

---

### 5. ▶️ Start Detection Session

```http
POST /api/session/start
```

**Description:** เริ่มต้น detection session สำหรับติดตามการใช้งาน

**Request Body:**

```json
{
  "settings": {
    "model": "yolo",
    "confidenceThreshold": 0.7,
    "frameInterval": 500,
    "autoStart": true,
    "enablePreprocessing": true
  }
}
```

**Response:**

```json
{
  "status": "success",
  "sessionId": "session_1727172600",
  "action": "started",
  "timestamp": "2025-09-24T10:30:00.000Z",
  "message": "Detection session started successfully",
  "sessionData": {
    "startTime": "2025-09-24T10:30:00.000Z",
    "settings": {
      "model": "yolo",
      "confidenceThreshold": 0.7,
      "frameInterval": 500,
      "autoStart": true,
      "enablePreprocessing": true
    }
  }
}
```

---

### 6. ⏹️ End Detection Session

```http
POST /api/session/end
```

**Description:** สิ้นสุด detection session และสร้างสรุปผล

**Request Body:**

```json
{
  "sessionId": "session_1727172600"
}
```

**Response:**

```json
{
  "status": "success",
  "sessionId": "session_1727172600",
  "action": "ended",
  "timestamp": "2025-09-24T11:30:00.000Z",
  "message": "Detection session ended successfully",
  "sessionData": {
    "endTime": "2025-09-24T11:30:00.000Z",
    "summary": {
      "duration": 3600,
      "totalFrames": 150,
      "drowsyFrames": 12,
      "alertsTriggered": 3
    }
  }
}
```

---

### 7. 📈 Get Session History

```http
GET /api/session/history
```

**Description:** ขอประวัติ detection sessions ที่ผ่านมา

**Response:**

```json
{
  "status": "success",
  "totalSessions": 5,
  "totalDrowsyDetections": 47,
  "timestamp": "2025-09-24T10:30:00.000Z",
  "sessions": [
    {
      "id": "session_1727169000",
      "startTime": "2025-09-24T09:30:00.000Z",
      "endTime": "2025-09-24T10:30:00.000Z",
      "duration": 3600,
      "totalFrames": 120,
      "drowsyFrames": 7,
      "alertsTriggered": 2,
      "averageConfidence": 0.75,
      "modelUsed": "yolo",
      "isActive": false,
      "settings": {
        "model": "yolo",
        "confidenceThreshold": 0.5,
        "frameInterval": 500,
        "autoStart": true,
        "enablePreprocessing": true
      }
    }
  ]
}
```

---

## ❌ Error Responses

เมื่อเกิดข้อผิดพลาด API จะส่ง HTTP status code ที่เหมาะสมพร้อม error response:

```json
{
  "status": "error",
  "message": "Description of the error",
  "timestamp": "2025-09-24T10:30:00.000Z",
  "errorCode": "ERROR_CODE_NAME",
  "details": {
    "field": "fieldName",
    "validationMessage": "Specific validation error",
    "receivedValue": "invalid_value"
  }
}
```

### Common Error Codes:

- **400 Bad Request**: ข้อมูลที่ส่งมาไม่ถูกต้อง
- **404 Not Found**: ไม่พบ endpoint ที่ระบุ
- **500 Internal Server Error**: เกิดข้อผิดพลาดในระบบ

---

## 📊 Response Fields Reference

| Field            | Type    | Description                                            |
| ---------------- | ------- | ------------------------------------------------------ |
| `isDrowsy`       | boolean | `true` = ตรวจพบอาการง่วงนอน, `false` = สดชื่น          |
| `confidence`     | float   | ความมั่นใจของ model (0.0-1.0)                          |
| `bbox`           | object  | พิกัด bounding box `{x, y, width, height}`             |
| `alertTriggered` | boolean | `true` เมื่อ `isDrowsy=true` และ `confidence>0.7`      |
| `inferenceTime`  | float   | เวลาประมวลผล (วินาที)                                  |
| `modelUsed`      | string  | Model ที่ใช้: `"yolo"` \| `"faster_rcnn"` \| `"vgg16"` |
| `sessionId`      | string  | รหัสระบุ session (ถ้ามี)                               |

---

## 🔧 Development Features

### Mock Data Mode

Backend รันในโหมด Mock Data ที่:

- ✅ ไม่ต้องการ ML models จริง
- ✅ ส่งค่าผลลัพธ์แบบสมจริง (30% chance of drowsiness)
- ✅ จำลอง inference time และ network delay
- ✅ รองรับทุก API endpoints

### Model Performance Simulation

| Model        | Speed  | Accuracy | Memory Usage | Inference Time |
| ------------ | ------ | -------- | ------------ | -------------- |
| YOLO         | Fast   | 87%      | Medium       | 0.1-0.3s       |
| Faster R-CNN | Slow   | 91%      | High         | 0.5-1.2s       |
| VGG16        | Medium | 83%      | Low          | 0.2-0.6s       |

---

## 📁 Project Structure

```
backend/
├── app_mock.py              # Main Flask application (Mock version)
├── app.py                   # Production Flask app (with real ML models)
├── requirements.txt         # Full dependencies with ML libraries
├── models/
│   ├── __init__.py
│   └── real_model_loader.py # Real YOLO model loader/inference
├── utils/
│   ├── __init__.py
│   ├── image_processing.py # Image preprocessing utilities
│   └── response_formatter.py # API response formatter
└── .venv/                  # Virtual environment
```

---

## 🧪 Testing

### Manual Testing with cURL

**Health Check:**

```bash
curl http://localhost:8000/api/health
```

**Get Models:**

```bash
curl http://localhost:8000/api/models
```

**Single Detection:**

```bash
curl -X POST http://localhost:8000/api/detect \
  -H "Content-Type: application/json" \
  -d '{
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ...",
    "model": "yolo",
    "sessionId": "test_123"
  }'
```

### Frontend Integration

API ถูกออกแบบมาให้ใช้งานร่วมกับ Ionic React frontend ที่:

- ✅ รองรับ CORS
- ✅ ใช้ JSON format
- ✅ มี error handling ที่ชัดเจน
- ✅ รองรับ base64 image uploads

---

## 🚀 Production Deployment

สำหรับ production ให้:

1. **ติดตั้ง ML dependencies:**

```bash
pip install -r requirements.txt
```

2. **ใช้ production WSGI server:**

```bash
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

3. **กำหนด environment variables:**

```bash
export API_HOST=0.0.0.0
export API_PORT=8000
export DEBUG=False
```

---

## 📝 API Design Principles

- **RESTful**: ใช้ HTTP methods ตามมาตรฐาน
- **Consistent**: Response format เหมือนกันทุก endpoint
- **Error-friendly**: Error messages ที่เข้าใจง่าย
- **Mobile-optimized**: รองรับ base64 image uploads
- **Scalable**: Session management สำหรับ tracking

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -m 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit pull request

---

## 📄 License

This project is part of Driver Drowsiness Detection System.
