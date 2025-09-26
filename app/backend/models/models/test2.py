from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image
import base64
import io

# โหลดโมเดล
model = YOLO("./yolo.pt")

# วิธีการ 1: ทดสอบแบบเดิม (path โดยตรง)
print("=== Method 1: Direct path ===")
results1 = model("./messageImage_1758889206328.jpg")
for result in results1:
    if result.boxes is not None:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            print(f"Direct - Class {cls_id}, Conf: {conf:.3f}")

# วิธีการ 2: จำลอง API flow
print("\n=== Method 2: Simulate API flow ===")

# อ่านภาพและแปลงเหมือน API
with open("./messageImage_1758889206328.jpg", "rb") as f:
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
print("Inference done.: ", results2)
for result in results2:
    if result.boxes is not None:
        for box in result.boxes:
            cls_id = int(box.cls[0])
            conf = float(box.conf[0])
            print(f"API-like - Class {cls_id}, Conf: {conf:.3f}")
