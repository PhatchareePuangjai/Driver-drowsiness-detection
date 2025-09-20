# Data Directory
## ข้อมูลสำหรับการฝึกและทดสอบโมเดล

### โครงสร้างไฟล์

```
data/
├── raw/                           # ข้อมูลดิบ
│   ├── images/                   # ภาพต้นฉบับ
│   │   ├── alert/               # ภาพสถานะตื่นตัว
│   │   └── drowsy/              # ภาพสถานะง่วง
│   └── videos/                   # วิดีโอต้นฉบับ
│       ├── alert/
│       └── drowsy/
├── processed/                     # ข้อมูลที่ประมวลผลแล้ว
│   ├── train/                    # ข้อมูลฝึก
│   │   ├── alert/
│   │   └── drowsy/
│   ├── val/                      # ข้อมูลตรวจสอบ
│   │   ├── alert/
│   │   └── drowsy/
│   └── test/                     # ข้อมูลทดสอบ
│       ├── alert/
│       └── drowsy/
├── annotations/                   # Annotation files
│   ├── train.json               # COCO format annotations
│   ├── val.json
│   └── test.json
└── augmented/                     # ข้อมูลที่เพิ่มจาก Data Augmentation
    ├── alert/
    └── drowsy/
```

### ข้อมูลที่ใช้

1. **ประเภทข้อมูล**:
   - ภาพหน้าของผู้ขับขี่ในสถานะต่างๆ
   - วิดีโอการขับขี่แบบต่อเนื่อง

2. **Labels**:
   - **Alert (0)**: สถานะตื่นตัว, ตาเปิด, ไม่หาว
   - **Drowsy (1)**: สถานะง่วง, ตาปิด/ครึ่งปิด, หาว, ศีรษะสัปหงก

3. **Format**:
   - ภาพ: JPG, PNG (640x480 หรือสูงกว่า)
   - วิดีโอ: MP4, AVI (30 FPS)
   - Annotations: COCO JSON format สำหรับ Object Detection

### การเตรียมข้อมูล

```bash
# ย้ายข้อมูลดิบไปยังโฟลเดอร์ raw/
python scripts/organize_data.py

# สร้าง annotations
python scripts/create_annotations.py

# แบ่งข้อมูล train/val/test
python scripts/split_dataset.py --ratio 0.7 0.2 0.1

# Data Augmentation
python scripts/augment_data.py --output_dir augmented/
```

### Data Augmentation Techniques

1. **Geometric Transformations**:
   - Rotation (-15° to +15°)
   - Horizontal flip
   - Slight translation

2. **Color Transformations**:
   - Brightness adjustment
   - Contrast adjustment
   - Hue/Saturation changes

3. **Noise Addition**:
   - Gaussian noise
   - Salt and pepper noise

### ข้อกำหนดข้อมูล

- **ขนาดข้อมูลขั้นต่ำ**: 1,000 ภาพต่อคลาส
- **ความหลากหลาย**: ผู้คนหลากหลายเชื้อชาติ, อายุ, เพศ
- **สภาพแวดล้อม**: แสงธรรมชาติ, แสงเทียม, สภาพอากาศต่างๆ
- **คุณภาพ**: ความละเอียดขั้นต่ำ 480p, ไม่เบลอ

### การใช้งาน

```python
from torch.utils.data import DataLoader
from datasets import DrowsinessDataset

# โหลดข้อมูล
train_dataset = DrowsinessDataset(
    data_dir='data/processed/train/',
    annotations='data/annotations/train.json'
)

train_loader = DataLoader(
    train_dataset, 
    batch_size=32, 
    shuffle=True
)
```