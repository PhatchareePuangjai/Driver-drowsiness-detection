from ultralytics import YOLO
import cv2

# โหลดโมเดลจากไฟล์ .pt (เช่น yolov11m.pt)
model = YOLO("./yolo.pt")

# กำหนด path ของภาพที่ต้องการทดสอบ
img_path = "./messageImage_1758889206328.jpg"

# รัน inference
results = model(img_path)

print("Inference done.: ", results)

# แสดงผลลัพธ์แบบ text
for result in results:
    boxes = result.boxes  # bounding boxes
    for box in boxes:
        cls_id = int(box.cls[0])  # class id
        conf = float(box.conf[0])  # confidence
        xyxy = box.xyxy[0].tolist()  # [x1, y1, x2, y2]
        print(f"Class {cls_id}, Conf: {conf:.2f}, BBox: {xyxy}")


# หากต้องการ visualize
annotated_img = results[0].plot()
cv2.imshow("Result", annotated_img)
cv2.waitKey(0)
cv2.destroyAllWindows()
