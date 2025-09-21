# Driver Drowsiness Detection System

## ระบบตรวจจับอาการง่วงนอนของผู้ขับขี่

### 📋 ภาพรวมโครงงาน

โครงงานนี้เป็นการพัฒนาระบบตรวจจับอาการง่วงนอนของผู้ขับขี่โดยใช้เทคโนโลยี Computer Vision และ Deep Learning เพื่อวิเคราะห์พฤติกรรมทางกายภาพ เช่น การปิดตา การหาว และการสัปหงกของศีรษะ ผ่านแอปพลิเคชันมือถือ Android แบบ Real-time เพื่อป้องกันอุบัติเหตุจากการหลับในขณะขับขี่

### 🎯 วัตถุประสงค์

1. **พัฒนาโมเดล Deep Learning** สำหรับตรวจจับลักษณะทางกายภาพที่บ่งบอกถึงอาการง่วงนอน

   - การปิดของเปลือกตา (Eyelid Closure)
   - การหาว (Yawning)
   - การสัปหงกของศีรษะ (Head Nodding)

2. **จำแนกสถานะการขับขี่** ออกเป็น 2 คลาส:

   - **Alert** (ตื่นตัว)
   - **Drowsy** (ง่วง)

3. **ระบบแจ้งเตือน Real-time** ผ่าน Android Application พร้อมเสียงเตือนเมื่อตรวจพบอาการง่วง

### 🏗️ โครงสร้างโปรเจ็กต์

```
Driver-drowsiness-detection/
├── 📁 models/                     # ส่วน Machine Learning Models
│   ├── 📁 yolo/                   # YOLO Implementation
│   ├── 📁 faster_rcnn/            # Faster R-CNN (Baseline)
│   ├── 📁 vgg16/                  # VGG16 Implementation
│   └── 📁 shared/                 # Shared utilities & preprocessing
├── 📁 app/                        # ส่วน Application Development
│   ├── 📁 android/                # Android Mobile App
│   └── 📁 backend/                # Backend API Server
├── 📁 data/                       # ข้อมูลสำหรับการฝึกและทดสอบ
├── 📁 docs/                       # เอกสารและวิธีการใช้งาน
├── 📄 README.md                   # ไฟล์นี้
└── 📄 requirements.txt            # Python dependencies
```

## 🤖 ส่วน Models (Machine Learning)

### สถาปัตยกรรมที่ใช้

#### 1. **YOLO (You Only Look Once)**

- **ประเภท**: One-Stage Detector
- **จุดเด่น**: ความเร็วสูง, เหมาะกับ Real-time detection
- **การใช้งาน**: ตรวจจับวัตถุขนาดเล็ก เช่น การปิดตา การหาว

#### 2. **Faster R-CNN (Baseline)**

- **ประเภท**: Two-Stage Detector
- **จุดเด่น**: ความแม่นยำสูงมาก, ลด False Positive
- **การใช้งาน**: ใช้เป็น Baseline สำหรับเปรียบเทียบประสิทธิภาพ

#### 3. **VGG16**

- **ประเภท**: CNN Feature Extractor
- **จุดเด่น**: โครงสร้างเรียบง่าย, มี Pretrained Models มากมาย
- **การใช้งาน**: Classification และ Feature Extraction

### 🔧 การเข้าถึงส่วน Models

```bash
# เข้าไปยังโฟลเดอร์ models
cd models/

# ทำงานกับ YOLO
cd yolo/
python train_yolo.py           # ฝึกโมเดล YOLO
python test_yolo.py            # ทดสอบโมเดล

# ทำงานกับ Faster R-CNN
cd ../faster_rcnn/
python train_faster_rcnn.py    # ฝึกโมเดล Faster R-CNN
python evaluate.py             # ประเมินผล

# ทำงานกับ VGG16
cd ../vgg16/
python train_vgg16.py          # ฝึกโมเดล VGG16
python classify.py             # จำแนกประเภท

# Shared utilities
cd ../shared/
python preprocessing.py        # ประมวลผลภาพเบื้องต้น
python data_augmentation.py    # เพิ่มข้อมูลฝึก
```

## 📱 ส่วน Application

### Android Mobile App

- **เป้าหมาย**: ระบบแจ้งเตือนแบบ Real-time บนมือถือ
- **ฟีเจอร์**:
  - บันทึกวิดีโอจากกล้องหน้า
  - วิเคราะห์อาการง่วงแบบทันที
  - แจ้งเตือนด้วยเสียงและการสั่น

### Backend API Server

- **หน้าที่**: ประมวลผลโมเดล ML และส่งผลลัพธ์กลับ
- **เทคโนโลจี**: Python Flask/FastAPI + PyTorch

### 🔧 การเข้าถึงส่วน Application

```bash
# เข้าไปยังโฟลเดอร์ app
cd app/

# ทำงานกับ Android App
cd android/
# ใช้ Android Studio เพื่อเปิดโปรเจ็กต์

# ทำงานกับ Backend Server
cd ../backend/
python app.py                  # เริ่มเซิร์ฟเวอร์
python api/inference.py        # API สำหรับการทำนาย
```

## 🚀 การติดตั้งและเริ่มต้นใช้งาน

### ความต้องการของระบบ

- **Python**: 3.8 หรือสูงกว่า
- **GPU**: สำหรับการฝึกโมเดล (แนะนำ)
- **Android Studio**: สำหรับพัฒนา Mobile App
- **RAM**: อย่างน้อย 8GB (แนะนำ 16GB)

### การติดตั้ง Dependencies

```bash
# Clone repository
git clone <repository-url>
cd Driver-drowsiness-detection

# สร้าง virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# หรือ venv\Scripts\activate  # Windows

# ติดตั้ง dependencies
pip install -r requirements.txt
```

### 📊 ไลบรารีหลักที่ใช้งาน

- **PyTorch**: สำหรับฝึกและใช้งานโมเดล Deep Learning
- **Ultralytics YOLO**: สำหรับ YOLO implementation
- **Detectron2**: สำหรับ Faster R-CNN
- **TorchVision**: สำหรับ VGG16 และ preprocessing
- **OpenCV**: สำหรับการประมวลผลภาพและวิดีโอ
- **Flask/FastAPI**: สำหรับ Backend API

## 📈 การประเมินผล

โมเดลจะถูกประเมินด้วยเมตริกต่างๆ ดังนี้:

- **Accuracy**: ความแม่นยำโดยรวม
- **F1-Score**: สมดุลระหว่าง Precision และ Recall
- **mAP (mean Average Precision)**: สำหรับ Object Detection
- **Inference Speed (FPS)**: ความเร็วในการประมวลผล

## 🔒 ข้อจำกัด

1. **สิ่งกีดขวาง**: ประสิทธิภาพอาจลดลงเมื่อมีแว่นกันแดดเข้ม หน้ากากอนามัย
2. **สภาพแสง**: อาจไม่ทำงานได้ดีในสภาวะแสงน้อยหรือแสงจ้าเกินไป
3. **ขอบเขต**: ไม่ครอบคลุมการตรวจจับจากพฤติกรรมการขับขี่หรือสัญญาณทางสรีรวิทยาอื่นๆ

# Link data set

1. https://www.kaggle.com/datasets/cubeai/drowsiness-detection-for-yolov8
2. https://www.kaggle.com/datasets/zeyad1mashhour/driver-inattention-detection-dataset?select=test
3. https://www.kaggle.com/datasets/nikospetrellis/nitymed
