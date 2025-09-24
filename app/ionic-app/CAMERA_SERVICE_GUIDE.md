# Camera Service Usage Guide

## Overview
Camera Service เป็น service สำหรับจัดการกล้องและการตรวจจับภาวะง่วงนอนแบบ real-time ใน Ionic React App

## Features
- ✅ **Real-time Camera Capture** - ถ่ายภาพอัตโนมัติทุก 2 วินาที
- ✅ **Multiple ML Models** - รองรับ YOLO, Faster R-CNN, และ VGG16
- ✅ **Smart Model Fallback** - ใช้ Mock data เมื่อ Backend ไม่พร้อม
- ✅ **Event-driven Architecture** - Real-time notifications และ updates
- ✅ **Session Statistics** - ติดตามสถิติการตรวจจับ
- ✅ **Customizable Settings** - ปรับ interval, model, และ sensitivity

## Installation

### 1. Install Dependencies
```bash
npm install @capacitor/camera
```

### 2. Import Camera Service
```typescript
import { cameraService } from '../services/camera.service';
```

## Basic Usage

### 1. Initialize Camera Service
```typescript
import React, { useEffect, useState } from 'react';
import { cameraService, CameraStatus } from '../services/camera.service';

const YourComponent: React.FC = () => {
  const [cameraStatus, setCameraStatus] = useState<CameraStatus>();

  useEffect(() => {
    // Listen to status changes
    const handleStatusChange = (status: CameraStatus) => {
      setCameraStatus(status);
    };

    cameraService.on('statusChanged', handleStatusChange);

    // Get initial status
    setCameraStatus(cameraService.getStatus());

    // Cleanup
    return () => {
      cameraService.removeListener('statusChanged', handleStatusChange);
    };
  }, []);

  return (
    <div>
      <p>Camera Status: {cameraStatus?.isInitialized ? 'Ready' : 'Initializing'}</p>
    </div>
  );
};
```

### 2. Start/Stop Continuous Monitoring
```typescript
// Start continuous capture (every 2 seconds)
const startMonitoring = async () => {
  try {
    await cameraService.startContinuousCapture(2000);
  } catch (error) {
    console.error('Failed to start monitoring:', error);
  }
};

// Stop monitoring
const stopMonitoring = () => {
  cameraService.stopContinuousCapture();
};
```

### 3. Single Photo Analysis
```typescript
const takeSinglePhoto = async () => {
  try {
    const result = await cameraService.analyzeSinglePhoto('yolo');
    console.log('Detection result:', result);
  } catch (error) {
    console.error('Analysis failed:', error);
  }
};
```

### 4. Listen to Detection Results
```typescript
useEffect(() => {
  const handleDetectionResult = (data: any) => {
    const { frame, result, alertLevel } = data;
    
    if (result.isDrowsy && result.confidence > 0.7) {
      // Show drowsiness alert
      alert(`Drowsiness detected! Confidence: ${(result.confidence * 100).toFixed(1)}%`);
    }
  };

  cameraService.on('detectionResult', handleDetectionResult);

  return () => {
    cameraService.removeListener('detectionResult', handleDetectionResult);
  };
}, []);
```

## Event System

### Available Events
- **statusChanged** - Camera status updates
- **detectionResult** - Real-time detection results
- **singleDetection** - Single photo analysis results
- **error** - General errors
- **captureError** - Camera capture errors
- **analysisError** - API analysis errors
- **settingsChanged** - Settings updates

### Event Data Structures

#### Detection Result Event
```typescript
{
  frame: DetectionFrame,
  result: DetectionResult,
  alertLevel: number // 0-3 (0=safe, 3=danger)
}
```

#### Status Change Event
```typescript
{
  isInitialized: boolean,
  isCapturing: boolean,
  hasPermission: boolean,
  lastCaptureTime?: Date,
  captureCount: number,
  errorMessage?: string
}
```

## Configuration

### Camera Settings
```typescript
const updateSettings = () => {
  cameraService.updateSettings({
    quality: 80,          // 0-100
    width: 640,           // pixels
    height: 480,          // pixels
    saveToGallery: false  // don't save photos
  });
};
```

### Detection Models
```typescript
// Available models:
const models = ['yolo', 'faster_rcnn', 'vgg16'];

// YOLO: Fast, good for real-time
// Faster R-CNN: Most accurate, slower
// VGG16: Lightweight, basic detection
```

## API Integration

### Backend Endpoints Used
- `POST /api/detect` - Single image detection
- `GET /api/health` - Backend health check
- `GET /api/models` - Available models

### Mock Fallback
เมื่อ Backend ไม่พร้อม Camera Service จะใช้ Mock data:
- สุ่มผลลัพธ์ 30% drowsy, 70% alert
- จำลอง inference time และ confidence
- ใช้งานได้ปกติแม้ไม่มี internet

## Error Handling

### Common Errors
1. **Camera Permission Denied**
   ```typescript
   if (!cameraStatus.hasPermission) {
     // Request permission again or show instructions
   }
   ```

2. **Backend Connection Failed**
   ```typescript
   cameraService.on('error', (error) => {
     if (error.message.includes('Network')) {
       // Switch to offline mode or retry
     }
   });
   ```

3. **Camera Hardware Issues**
   ```typescript
   cameraService.on('captureError', (error) => {
     // Show user-friendly error message
     // Suggest troubleshooting steps
   });
   ```

## Performance Optimization

### Recommended Settings
```typescript
// For Real-time Monitoring
{
  captureInterval: 2000,    // 2 seconds
  model: 'yolo',           // fastest model
  quality: 70,             // balance quality/speed
  width: 640, height: 480  // moderate resolution
}

// For Accurate Detection
{
  captureInterval: 5000,    // 5 seconds
  model: 'faster_rcnn',    // most accurate
  quality: 90,             // high quality
  width: 1280, height: 720 // high resolution
}

// For Battery Saving
{
  captureInterval: 10000,   // 10 seconds
  model: 'vgg16',          // lightweight
  quality: 60,             // lower quality
  width: 480, height: 360  // low resolution
}
```

### Memory Management
```typescript
// Clean up when component unmounts
useEffect(() => {
  return () => {
    cameraService.dispose(); // Stop capture and clean up
  };
}, []);
```

## Mobile Considerations

### iOS
- แต่เป็นำใ Permission description ใน `Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>This app uses camera for drowsiness detection to keep you safe while driving.</string>
```

### Android
- เพิ่ม permissions ใน `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
```

### Capacitor Configuration
```typescript
// capacitor.config.ts
{
  plugins: {
    Camera: {
      iosImagePickerAspectRatio: "16:9"
    }
  }
}
```

## Testing

### Unit Testing
```typescript
// Mock camera service for testing
jest.mock('../services/camera.service', () => ({
  cameraService: {
    startContinuousCapture: jest.fn(),
    stopContinuousCapture: jest.fn(),
    getStatus: jest.fn(() => ({
      isInitialized: true,
      hasPermission: true,
      isCapturing: false,
      captureCount: 0
    }))
  }
}));
```

### Integration Testing
```typescript
// Test with mock API responses
beforeEach(() => {
  // Set up mock API responses
  mockApiService.detectDrowsiness.mockResolvedValue({
    isDrowsy: false,
    confidence: 0.8,
    modelUsed: 'yolo',
    // ... other properties
  });
});
```

## Troubleshooting

### Common Issues

1. **Camera Not Starting**
   - Check permissions
   - Verify device has camera
   - Restart app

2. **Detection Not Working**
   - Check network connection
   - Verify Backend is running
   - Check API endpoints

3. **High Battery Usage**
   - Increase capture interval
   - Use lighter model (VGG16)
   - Reduce image quality

4. **Memory Warnings**
   - Call `dispose()` when done
   - Monitor capture statistics
   - Clear old detection results

### Debug Mode
```typescript
// Enable debug logging
localStorage.setItem('camera-debug', 'true');

// Check service statistics
console.log(cameraService.getStatistics());
```

## Example Implementation

ดูตัวอย่างการใช้งานเต็มใน:
- `src/components/CameraPage.tsx` - Complete UI implementation
- `src/services/camera.service.ts` - Service implementation
- `src/app/services/api.service.ts` - API communication

## Support

หากมีปัญหาการใช้งาน:
1. ตรวจสอบ Console logs
2. ดู Network tab ใน DevTools
3. ทดสอบกับ Mock data ก่อน
4. ตรวจสอบ Camera permissions

## Version History

- **v1.0.0** - Initial release with basic camera capture
- **v1.1.0** - Added ML model integration
- **v1.2.0** - Added event system and statistics
- **v1.3.0** - Added mock fallback and error handling