# Driver Drowsiness Detection System

## 🧭 ภาพรวม

โปรเจกต์นี้รวมโค้ดทั้งหมดที่ใช้ในการสร้างระบบตรวจจับอาการง่วงนอนของผู้ขับขี่ ตั้งแต่ขั้นตอนเตรียมข้อมูล → ฝึกโมเดล → ประเมินผล ไปจนถึงการให้บริการผ่าน Backend API และ Ionic Front-end โดยปรับโครงสร้างใหม่ให้สอดคล้องกับเกณฑ์ reproducibility และใช้งานได้จริงทั้งแบบเต็มรูปแบบและโหมด demo สำหรับทดสอบรวดเร็ว

## 📂 โครงสร้างไดเรกทอรีล่าสุด

```text
Driver-drowsiness-detection/
├── data/                 # ข้อมูลดิบและข้อมูลที่ผ่านการ preprocessing
│   ├── raw/              # วาง dataset ต้นฉบับที่นี่
│   └── processed/        # pipeline จะสร้างโฟลเดอร์ train/val/test อัตโนมัติ
├── demos/                # โฟลเดอร์สำหรับวิดีโอเดโม (easy.mp4, medium.mp4, hard.mp4)
├── docs/                 # เอกสารอ้างอิงเพิ่มเติม
├── models/
│   ├── evaluations/      # ผลการประเมินโมเดล (สร้างใหม่หลังรัน pipeline)
│   ├── weights/          # ไฟล์ weight (.pt) ที่ใช้งานจริง
│   └── ...               # โน้ตบุ๊ก/สคริปต์ฝึกโมเดลเดิมเก็บไว้เช่นเดิม
├── scripts/
│   └── install.sh        # สคริปต์ช่วยติดตั้งบนเครื่องใหม่ (ออปชัน)
├── src/
│   ├── backend/          # Flask API จริง (ย้ายมาจาก app/backend)
│   ├── frontend/         # Ionic React app (ย้ายมาจาก app/ionic-app)
│   └── pipelines/        # สคริปต์ preprocessing → training → evaluation
├── requirements.txt      # Python dependencies ทั้งหมด
└── README.md             # ไฟล์นี้ (ภาษาไทย)
```

> ✅ โฟลเดอร์ `demos/` สร้างไว้ล่วงหน้าแล้วเพื่อให้เพิ่มวิดีโอทั้งสามสเกลได้ทันที

## 🛠️ การเตรียมสภาพแวดล้อม

- Python 3.9 ขึ้นไป (แนะนำ 3.11)
- macOS/Ubuntu/Windows ที่รองรับ PyTorch และ OpenCV
- Node.js 18 LTS (สำหรับ Ionic frontend)
- หากมี GPU จะช่วยให้การเทรนเต็มรูปแบบเร็วยิ่งขึ้น

```bash
# 1) สร้าง virtual environment
python3 -m venv .venv
source .venv/bin/activate            # macOS / Linux
# หรือ .venv\Scripts\activate       # Windows PowerShell

# 2) ติดตั้งไลบรารีทั้งหมด
pip install --upgrade pip
pip install -r requirements.txt

# 3) (ออปชัน) บนเครื่องใหม่สามารถใช้ scripts/install.sh เพื่อช่วยติดตั้ง
bash scripts/install.sh
```

## 🔁 Pipeline แบบทำซ้ำได้ (Preprocess → Train → Evaluate)

สคริปต์หลักอยู่ที่ `src/pipelines/run_all.py` และตั้งค่า random seed ค่าเดียว (ค่าเริ่มต้น 42) ให้ทุกขั้นตอนโดยอัตโนมัติ พร้อมสร้าง snapshot ของ environment ไว้ใน `outputs/pipeline/environment.txt`

### 1) โหมด Demo (รวดเร็ว ใช้ภาพตัวอย่างจาก tests)

```bash
PYTHONPATH=src python -m pipelines.run_all --demo
```

- สคริปต์จะคัดลอกภาพตัวอย่างจาก `src/backend/tests/images` ไปยัง `data/processed/`
- ข้ามขั้นตอนเทรนจริงและคัดลอก weight ปัจจุบันเป็น `models/weights/yolo_demo.pt`
- ประเมินผลแบบรวดเร็วพร้อมสร้างไฟล์ `models/evaluations/demo_results.json`
- บันทึกสรุปการรันไว้ที่ `outputs/pipeline/pipeline_summary.json`

### 2) โหมด Full Training

```bash
# เตรียมไฟล์ data/raw และไฟล์ config ของ Ultralytics (เช่น data/dataset.yaml)

PYTHONPATH=src python -m pipelines.run_all \
   --dataset-config data/dataset.yaml \
   --epochs 100 \
   --image-size 640
```

- ต้องมีไฟล์ `.yaml` ของ Ultralytics ที่อ้างอิง path ของ train/val/test
- ผลลัพธ์การเทรนจะถูกคัดลอกไปไว้ที่ `models/weights/yolo_finetuned.pt`
- ไฟล์ประเมินผลถูกสร้างใน `models/evaluations/evaluation_results.json`

> 💡 หากต้องการเปลี่ยนค่า random seed ให้ระบุ `--seed <ค่า>` และไฟล์ summary จะบันทึกไว้เพื่อการตรวจสอบย้อนหลังเสมอ

## ⚙️ การรัน Backend Flask API (โหมดโมเดลจริง)

โค้ดอยู่ใน `src/backend/` และใช้โครงสร้าง package เต็มรูปแบบแล้ว

```bash
# 1) สร้างและเปิดใช้ virtual environment (ถ้ายังไม่ได้ทำ)
source .venv/bin/activate

# 2) ตั้งค่า PYTHONPATH ให้เห็น src/
export PYTHONPATH=$(pwd)/src

# 3) รัน Flask server
python -m backend.app

# หรือใช้ gunicorn ใน production
gunicorn -w 4 -b 0.0.0.0:8000 backend.app:app
```

- ไฟล์ weight หลักคาดหวังที่ `models/weights/yolo.pt`
- สามารถเปลี่ยนตำแหน่ง weight ได้โดยตั้ง `MODEL_DIR=/path/to/weights`
- รูปที่ Annotated จาก API จะถูกเก็บที่ `src/backend/outputs/detections/`

## 🌐 การรัน Ionic Front-end

```bash
cd src/frontend/ionic-app
nvm use
npm install
npm run dev           # รันบน http://localhost:8100

# หากต้องการ build mobile ใช้คำสั่งมาตรฐานของ Capacitor / Ionic
npm run build
npx cap sync
```

> ก่อนรันให้ตั้งค่า `.env` หรือไฟล์ config ของ frontend ให้ชี้ไปที่ `http://localhost:8000` (หรือ URL ของ backend ที่ deploy)

## 🧪 การทดสอบ

- ชุดทดสอบที่ใช้โมเดลจริงอยู่ใน `src/backend/tests/`
- สามารถเรียกใช้พร้อมระบุเส้นทาง weight ใหม่ได้ เช่น

```bash
PYTHONPATH=src python src/backend/tests/test_yolo.py \
   --model ../../models/weights/yolo.pt \
   --image ./images/SafeDriving2.jpg
```

## 📦 ข้อมูลน้ำหนักโมเดล (Weights)

- `models/weights/yolo.pt`       : น้ำหนักหลักที่ใช้งานจริง (ต้องมีอยู่ก่อนรัน)
- `models/weights/yolo_demo.pt`  : ไฟล์ที่สร้างโดย pipeline โหมด demo
- `models/weights/yolo_finetuned.pt` : ไฟล์ที่ได้หลังรันเทรนเต็มรูปแบบ
- หากมีโมเดลอื่นเพิ่ม สามารถวางในโฟลเดอร์นี้และปรับ `MODEL_DIR` ให้ชี้ไปยังตำแหน่งใหม่ได้

## 🎥 โฟลเดอร์เดโม

- `demos/easy.mp4`
- `demos/medium.mp4`
- `demos/hard.mp4`

สามารถอัดวิดีโอตามเงื่อนไขแต่ละ scenario แล้ววางไฟล์ในโฟลเดอร์นี้เพื่อใช้ประกอบการนำเสนอ

## 📚 แหล่งข้อมูลสำหรับดาวน์โหลด dataset

1. [Drowsiness Detection for YOLOv8](https://www.kaggle.com/datasets/cubeai/drowsiness-detection-for-yolov8)
2. [Driver Inattention Detection Dataset](https://www.kaggle.com/datasets/zeyad1mashhour/driver-inattention-detection-dataset)
3. [Nitymed Dataset](https://www.kaggle.com/datasets/nikospetrellis/nitymed)

นำไฟล์ที่ดาวน์โหลดมาแตกไว้ใน `data/raw/` แล้วปรับไฟล์ `data/dataset.yaml` ให้สอดคล้องกับโครงสร้างของ Ultralytics

## 🆘 เคล็ดลับแก้ปัญหา

- หาก `import ultralytics` หรือ `torch` ไม่เจอ ตรวจสอบว่าได้ activate virtualenv และติดตั้ง dependencies แล้ว
- หาก backend หา weight ไม่เจอ ให้ตรวจ path ที่ `MODEL_DIR` และตรวจว่าไฟล์ `.pt` มีอยู่จริง
- Pipeline โหมด full ต้องใช้ GPU หรือใช้ `epochs` น้อยลง (เช่น 10) เพื่อทดสอบบน CPU

---

ระบบนี้ถูกออกแบบให้ทุกขั้นตอน reproducible โดยกำหนดค่า random seed คงที่ สร้าง summary ทุกครั้ง และมีโหมด demo เพื่อยืนยันผลลัพธ์ได้รวดเร็วบนเครื่องที่ทรัพยากรจำกัด
