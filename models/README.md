# Models Directory

## ส่วน Machine Learning Models สำหรับตรวจจับอาการง่วงนอน

### โครงสร้างไฟล์

```
models/
├── yolo/                         # YOLO Implementation
│   ├── train_yolo.py             # ฝึกโมเดล YOLO
│   ├── test_yolo.py              # ทดสอบโมเดล YOLO
│   ├── detect.py                 # Real-time detection
│   ├── config/                   # Configuration files
│   │   └── yolo_config.yaml
│   └── weights/                  # Trained model weights
│       └── best.pt
├── faster_rcnn/                  # Faster R-CNN (Baseline)
│   ├── train_faster_rcnn.py      # ฝึกโมเดล Faster R-CNN
│   ├── evaluate.py               # ประเมินผลโมเดล
│   ├── inference.py              # Inference script
│   └── config/
│       └── faster_rcnn_config.py
├── vgg16/                         # VGG16 Implementation
│   ├── train_vgg16.py             # ฝึกโมเดล VGG16
│   ├── classify.py                # จำแนกประเภท
│   └── feature_extractor.py       # Feature extraction
└── shared/                        # Shared utilities
    ├── preprocessing.py           # ประมวลผลภาพเบื้องต้น
    ├── data_augmentation.py       # Data augmentation
    ├── metrics.py                 # Evaluation metrics
    └── utils.py                   # Utility functions
```

### การใช้งาน

#### 1. YOLO Model

```bash
cd yolo/
python train_yolo.py --data ../data/dataset.yaml --epochs 100
python test_yolo.py --weights weights/best.pt --source 0
```

#### 2. Faster R-CNN Model

```bash
cd faster_rcnn/
python train_faster_rcnn.py --config config/faster_rcnn_config.py
python evaluate.py --model_path checkpoints/model_final.pth
```

#### 3. VGG16 Model

```bash
cd vgg16/
python train_vgg16.py --data_path ../data/processed/
python classify.py --image_path test_image.jpg
```

### ข้อมูลเบื้องต้น

- **Input**: ภาพหรือวิดีโอสตรีมจากกล้อง
- **Output**: การจำแนก Alert/Drowsy พร้อมตำแหน่งใบหน้า
- **Classes**:
  - 0: Alert (ตื่นตัว)
  - 1: Drowsy (ง่วง)

### Dependencies สำหรับ Models

```
torch>=1.9.0
torchvision>=0.10.0
ultralytics>=8.0.0
detectron2
opencv-python>=4.5.0
numpy>=1.21.0
matplotlib>=3.3.0
pillow>=8.0.0
```
