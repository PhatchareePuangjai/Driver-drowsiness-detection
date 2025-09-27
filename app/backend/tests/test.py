from ultralytics import YOLO
import cv2
from pathlib import Path
import sys
import argparse


def resolve_path(base_file: str, relative: str) -> Path:
    # อ้างอิงจากตำแหน่งไฟล์สคริปต์เสมอ
    return (Path(base_file).resolve().parent / relative).resolve()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--model",
        default="../models/models/yolo.pt",
        help="path ไปยังไฟล์ .pt (relative จาก tests/test.py ได้)",
    )
    parser.add_argument(
        "--image",
        default="./images/SafeDriving2.jpg",
        help="path รูปภาพทดสอบ (relative จาก tests/test.py ได้)",
    )
    parser.add_argument(
        "--save", default="./outputs/result.jpg", help="ไฟล์เอาต์พุตสำหรับภาพที่ใส่บ็อกซ์แล้ว"
    )
    args = parser.parse_args()

    script_file = __file__  # ตำแหน่งไฟล์สคริปต์นี้
    model_path = resolve_path(script_file, args.model)
    img_path = resolve_path(script_file, args.image)
    save_path = resolve_path(script_file, args.save)

    # ตรวจ path ให้ชัดเจน
    if not model_path.exists():
        print(f"[ERROR] ไม่พบโมเดล: {model_path}")
        print("→ ตรวจว่าโครงสร้างโฟลเดอร์ถูกต้อง หรือส่ง --model เป็น path ที่ถูกต้อง")
        sys.exit(1)

    if not img_path.exists():
        print(f"[ERROR] ไม่พบรูปภาพ: {img_path}")
        print("→ ตรวจว่าไฟล์รูปอยู่จริง หรือส่ง --image เป็น path ที่ถูกต้อง")
        sys.exit(1)

    print(f"[INFO] ใช้โมเดล: {model_path}")
    print(f"[INFO] ใช้ภาพ:   {img_path}")

    # โหลดโมเดล
    model = YOLO(str(model_path))

    # รัน inference (ตั้ง conf ตามต้องการ)
    results = model.predict(source=str(img_path), conf=0.25, verbose=False)

    if not results:
        print("[WARN] ไม่มีผลลัพธ์จากโมเดล")
        sys.exit(0)

    # แสดงผลลัพธ์แบบข้อความ
    names = (
        model.model.names
        if hasattr(model, "model") and hasattr(model.model, "names")
        else {}
    )
    for i, result in enumerate(results):
        print(f"[INFO] Result {i}: {img_path.name}")
        for b in result.boxes:
            cls_id = int(b.cls[0])
            conf = float(b.conf[0])
            x1, y1, x2, y2 = map(float, b.xyxy[0].tolist())
            cls_name = names.get(cls_id, str(cls_id))
            print(
                f" - {cls_name} ({cls_id}) conf={conf:.2f} box=[{x1:.1f},{y1:.1f},{x2:.1f},{y2:.1f}]"
            )

    # วาดบ็อกซ์และบันทึกไฟล์ (กันกรณีไม่มี GUI)
    annotated = results[0].plot()
    save_path.parent.mkdir(parents=True, exist_ok=True)
    ok = cv2.imwrite(str(save_path), annotated)
    if ok:
        print(f"[INFO] บันทึกภาพผลลัพธ์ → {save_path}")
    else:
        print("[WARN] ไม่สามารถบันทึกภาพผลลัพธ์ได้")

    # ถ้าต้องการเปิดหน้าต่าง (มี GUI) ให้ uncomment ด้านล่าง
    # cv2.imshow("Result", annotated)
    # cv2.waitKey(0)
    # cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
