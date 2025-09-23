# Faster R-CNN Model

#### 1. ติดตั้ง package ก่อน สำหรับ window

```bash
conda install pandas matplotlib pytorch torchvision torchaudio cudatoolkit=11.8 -c pytorch -y
pip install pycocotools scikit-learn tqdm
```
#### 2. ข้อไปที่ลิงค์นี้ https://universe.roboflow.com/driver-monitoring/dmd-tfiw0 ซ้ายมือเลือก Dataset เลือก download COCO JSON

#### 3. ลองเทรนกับรูปภาพน้อย ๆ โดยรันโค้ด 5.2 สำหรับทดสอบเท่านั้น

#### 4. ถ้าจะใช้รูปภาพทั้งหมด ไม่ต้องรันข้อ 5.2