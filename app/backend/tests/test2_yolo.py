from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image
import base64
import io
from pathlib import Path


def resolve_path(base_file: str, relative: str) -> Path:
    # อ้างอิงจากตำแหน่งไฟล์สคริปต์เสมอ
    return (Path(base_file).resolve().parent / relative).resolve()


script_file = __file__  # ตำแหน่งไฟล์สคริปต์นี้
model_path = resolve_path(script_file, "../models/models/yolo.pt")
img_path = resolve_path(script_file, "./images/SafeDriving1.jpg")

# โหลดโมเดล
model = YOLO(model_path)

# วิธีการ 1: ทดสอบแบบเดิม (path โดยตรง)
print("=== Method 1: Direct path ===")
results1 = model(img_path)
for result in results1:
    classes = result.names
    if result.boxes is not None:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            print(f"Direct - Class {classes[cls_id]}, Conf: {conf:.3f}")

# วิธีการ 2: จำลอง API flow
print("\n=== Method 2: Simulate API flow ===")

# อ่านภาพและแปลงเหมือน API
with open(img_path, "rb") as f:
    img_bytes = f.read()

# แปลงเป็น base64 (เหมือน API)
img_base64 = base64.b64encode(img_bytes).decode()

# Decode กลับเหมือน API
decoded_bytes = base64.b64decode(img_base64)
pil_image = Image.open(io.BytesIO(decoded_bytes))

# แปลงเป็น numpy array เหมือน real_model_loader.py
img_array = np.array(pil_image)

print(f"📸 PIL image: size={pil_image.size}, mode={pil_image.mode}")
print(f"📊 Array: shape={img_array.shape}, dtype={img_array.dtype}")

# รัน inference
results2 = model(img_array, verbose=False)

for result in results2:
    classes = result.names
    if result.boxes is not None:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            print(f"API-like - Class {classes[cls_id]}, Conf: {conf:.3f}")
