# การติดตั้งและเริ่มต้นใช้งาน

## ข้อกำหนดของระบบ

### Hardware Requirements

- **RAM**: อย่างน้อย 8GB (แนะนำ 16GB)
- **GPU**: NVIDIA GPU พร้อม CUDA support (สำหรับการฝึกโมเดล)
- **Storage**: อย่างน้อย 10GB ว่าง
- **CPU**: Intel i5 หรือ AMD Ryzen 5 ขึ้นไป

### Software Requirements

- **Python**: 3.8 - 3.10
- **Operating System**: Windows 10/11, macOS 10.15+, Ubuntu 18.04+
- **Android Studio**: Arctic Fox หรือใหม่กว่า (สำหรับพัฒนา Android)
- **Git**: สำหรับ version control

## การติดตั้ง

### 1. Clone Repository

```bash
git clone <repository-url>
cd Driver-drowsiness-detection
```

### 2. สร้าง Virtual Environment

```bash
# สร้าง virtual environment
python -m venv venv

# เปิดใช้งาน virtual environment
# สำหรับ macOS/Linux:
source venv/bin/activate

# สำหรับ Windows:
venv\Scripts\activate
```

### 3. ติดตั้ง Dependencies

```bash
# ติดตั้ง dependencies หลัก
pip install -r requirements.txt

# ติดตั้ง PyTorch สำหรับ GPU (ถ้ามี)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# ติดตั้ง Detectron2 (สำหรับ Faster R-CNN)
pip install 'git+https://github.com/facebookresearch/detectron2.git'
```

### 4. ตั้งค่า Environment Variables

สร้างไฟล์ `.env` ใน root directory:

```bash
# Model paths
MODEL_PATH=./models/weights/
DATA_PATH=./data/

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=False

# CUDA Configuration (ถ้ามี GPU)
CUDA_VISIBLE_DEVICES=0
```

## การใช้งาน

### 1. การฝึกโมเดล

```bash
# ฝึก YOLO model
cd models/yolo/
python train_yolo.py --data ../../data/dataset.yaml --epochs 100

# ฝึก Faster R-CNN model
cd ../faster_rcnn/
python train_faster_rcnn.py --config config/faster_rcnn_config.py

# ฝึก VGG16 model
cd ../vgg16/
python train_vgg16.py --data_path ../../data/processed/
```

### 2. เริ่มต้น Backend API

```bash
cd app/backend/

# ติดตั้ง dependencies สำหรับ backend
pip install -r requirements.txt

# เริ่มเซิร์ฟเวอร์
python app.py

# หรือใช้ gunicorn สำหรับ production
gunicorn -w 4 -b 0.0.0.0:8000 app:app
```

### 3. พัฒนา Android App

```bash
cd app/android/

# เปิดโปรเจ็กต์ด้วย Android Studio
# หรือ build จาก command line
./gradlew assembleDebug

# ติดตั้งบนอุปกรณ์
./gradlew installDebug
```

### 4. ทดสอบระบบ

```bash
# ทดสอบ API
curl -X GET http://localhost:8000/api/health

# ทดสอบการตรวจจับ
python test_detection.py --model yolo --source 0  # webcam
python test_detection.py --model yolo --source test_image.jpg
```

## การแก้ไขปัญหาที่พบบ่อย

### 1. CUDA/GPU Issues

```bash
# ตรวจสอบ CUDA installation
python -c "import torch; print(torch.cuda.is_available())"

# ติดตั้ง CUDA-compatible PyTorch
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### 2. OpenCV Issues

```bash
# ถ้า opencv-python ไม่ทำงาน
pip uninstall opencv-python
pip install opencv-python-headless
```

### 3. Memory Issues

```bash
# ลด batch size ในการฝึกโมเดล
# แก้ไขในไฟล์ config หรือ command line arguments
--batch_size 16  # แทน 32
```

### 4. Android Build Issues

```bash
# Clean และ rebuild
./gradlew clean
./gradlew assembleDebug

# ตรวจสอบ Java version
java -version  # ควรเป็น JDK 11 หรือ 17
```

## Performance Optimization

### 1. Model Optimization

```bash
# Convert model to ONNX format
python convert_to_onnx.py --model yolo --weights best.pt

# Quantization สำหรับ mobile
python quantize_model.py --input model.pt --output model_quantized.pt
```

### 2. Backend Optimization

```bash
# ใช้ multiple workers
gunicorn -w 4 -b 0.0.0.0:8000 app:app

# ใช้ async processing
pip install fastapi uvicorn
# จากนั้นแทนที่ Flask ด้วย FastAPI
```

### 3. Mobile Optimization

- ใช้ model quantization
- ลดขนาด input image
- ใช้ background processing
- Cache model predictions

## Deployment

### Docker Deployment

สร้างไฟล์ `Dockerfile`:

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "app:app"]
```

```bash
# Build และ run
docker build -t drowsiness-api .
docker run -p 8000:8000 drowsiness-api
```

### Production Deployment

1. **Backend**: Deploy บน cloud service (AWS, GCP, Azure)
2. **Android**: Build signed APK/AAB สำหรับ Google Play Store
3. **Monitoring**: ตั้งค่า logging และ monitoring system

## การ Monitor และ Debug

### Logging

```python
import logging

# ตั้งค่า logging level
logging.basicConfig(level=logging.INFO)

# ดู log files
tail -f logs/app.log
```

### Performance Monitoring

```bash
# Monitor GPU usage
nvidia-smi

# Monitor system resources
htop

# Monitor API performance
curl -w "@curl-format.txt" -X POST http://localhost:8000/api/detect
```
