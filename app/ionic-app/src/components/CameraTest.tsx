import React, { useState, useRef } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonImg,
  IonText,
  IonAlert
} from '@ionic/react';

const CameraTest: React.FC = () => {
  const [photoSrc, setPhotoSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const isWeb = Capacitor.getPlatform() === 'web';

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const debugMessage = `[${timestamp}] ${message}`;
    console.log(debugMessage);
    setDebugInfo(prev => [...prev.slice(-4), debugMessage]); // Keep last 5 messages
  };

  // Web-based camera permission and capture
  const requestWebCameraPermission = async () => {
    try {
      addDebugInfo('🔒 Requesting web camera permissions...');
      setError(null);
      
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('getUserMedia is not supported in this browser');
      }

      const constraints = { 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        } 
      };

      addDebugInfo(`🎯 Requesting camera with constraints: ${JSON.stringify(constraints)}`);
      
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      addDebugInfo(`✅ Camera stream obtained: ${mediaStream.getTracks().length} tracks`);
      
      setPermissionStatus('granted');
      addDebugInfo('✅ Permission status set to granted');
      
      // Stop the stream immediately after permission check
      mediaStream.getTracks().forEach((track, index) => {
        addDebugInfo(`🛑 Stopping track ${index}: ${track.kind}`);
        track.stop();
      });
      
    } catch (err: any) {
      addDebugInfo(`❌ Permission error: ${err.name} - ${err.message}`);
      setPermissionStatus('denied');
      
      let message = err.message;
      if (err.name === 'NotAllowedError') {
        message = 'Camera access denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError') {
        message = 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        message = 'Camera not supported in this browser.';
      } else if (err.name === 'NotReadableError') {
        message = 'Camera is already in use by another application.';
      }
      
      setError(`Camera error: ${message}`);
    }
  };

  const takeWebPhoto = async () => {
    try {
      setIsLoading(true);
      setError(null);
      addDebugInfo('🔍 Taking web photo...');
      
      const mediaStream = await navigator.mediaDevices!.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' }
      });

      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        video.srcObject = mediaStream;
        
        await new Promise((resolve, reject) => {
          video.onloadedmetadata = () => {
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 480;
            addDebugInfo(`📐 Video dimensions: ${canvas.width}x${canvas.height}`);
            resolve(true);
          };
          video.onerror = () => reject(new Error('Video failed to load'));
          setTimeout(() => reject(new Error('Video load timeout')), 10000);
          video.play().catch(reject);
        });

        // Small delay to ensure video is playing
        await new Promise(resolve => setTimeout(resolve, 500));

        if (context) {
          addDebugInfo('📷 Capturing frame from video...');
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          const base64 = dataUrl.split(',')[1];
          
          setPhotoSrc(dataUrl);
          addDebugInfo(`✅ Photo captured! Size: ${base64.length} chars`);
          
          await testBackendConnection(base64);
        }

        // Stop the stream
        mediaStream.getTracks().forEach(track => track.stop());
      }
      
    } catch (err: any) {
      addDebugInfo(`❌ Photo error: ${err.message}`);
      setError(`Photo error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const takePicture = async () => {
    if (isWeb) {
      return takeWebPhoto();
    }

    try {
      setIsLoading(true);
      setError(null);
      addDebugInfo('🔍 Taking mobile photo...');

      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
        width: 640,
        height: 480
      });

      if (image.dataUrl) {
        setPhotoSrc(image.dataUrl);
        addDebugInfo('✅ Mobile photo taken successfully!');
        await testBackendConnection(image.dataUrl.split(',')[1]);
      }
    } catch (err: any) {
      addDebugInfo(`❌ Mobile camera error: ${err.message}`);
      setError(`Mobile camera error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async () => {
    if (isWeb) {
      return requestWebCameraPermission();
    }

    try {
      addDebugInfo('🔒 Requesting mobile permissions...');
      const permissions = await Camera.requestPermissions({ permissions: ['camera'] });
      
      if (permissions.camera === 'granted') {
        setPermissionStatus('granted');
        addDebugInfo('✅ Mobile permission granted!');
      } else {
        setPermissionStatus('denied');
        setError('Camera permission denied');
      }
    } catch (err: any) {
      addDebugInfo(`❌ Mobile permission error: ${err.message}`);
      setPermissionStatus('denied');
      setError(`Permission error: ${err.message}`);
    }
  };

  const testBackendConnection = async (imageBase64: string) => {
    try {
      addDebugInfo('🌐 Testing backend connection...');
      
      const response = await fetch('http://localhost:8000/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageBase64,
          confidence_threshold: 0.5
        })
      });

      if (response.ok) {
        const result = await response.json();
        addDebugInfo(`✅ Backend response received`);
        
        const alertMsg = `Detection Result:\n${result.is_drowsy ? '😴 DROWSY' : '😊 ALERT'}\nConfidence: ${(result.confidence * 100).toFixed(1)}%\nModel: ${result.model_info?.name || 'Mock'}`;
        setError(alertMsg);
        setShowAlert(true);
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err: any) {
      addDebugInfo(`❌ Backend error: ${err.message}`);
      setError(`Backend error: ${err.message}`);
      setShowAlert(true);
    }
  };

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>
          🧪 Camera Test Component ({isWeb ? 'Web Mode' : 'Mobile Mode'})
        </IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        {/* Debug Information */}
        {debugInfo.length > 0 && (
          <div style={{ 
            backgroundColor: '#f8f9fa', 
            padding: '12px', 
            borderRadius: '8px', 
            marginBottom: '16px',
            border: '1px solid #e9ecef'
          }}>
            <strong>🔍 Debug Log:</strong>
            <div style={{ fontFamily: 'monospace', fontSize: '0.85em', marginTop: '8px' }}>
              {debugInfo.map((info, index) => (
                <div key={index} style={{ marginBottom: '4px' }}>{info}</div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <IonText color={error.includes('Detection Result') ? 'success' : 'danger'}>
            <p style={{ 
              whiteSpace: 'pre-line',
              padding: '12px', 
              backgroundColor: error.includes('Detection Result') ? '#e8f5e8' : '#ffe6e6', 
              borderRadius: '8px',
              margin: '12px 0'
            }}>
              <strong>{error.includes('Detection Result') ? '🎯 Result:' : '❌ Error:'}</strong><br/>
              {error}
            </p>
          </IonText>
        )}

        <div style={{ marginBottom: '16px' }}>
          <IonText>
            <p><strong>Platform:</strong> {isWeb ? 'Web Browser' : 'Mobile Device'}</p>
            <p><strong>Permission Status:</strong> 
              <span style={{ 
                color: permissionStatus === 'granted' ? 'green' : 
                      permissionStatus === 'denied' ? 'red' : 'orange',
                fontWeight: 'bold',
                marginLeft: '8px'
              }}>
                {permissionStatus}
              </span>
            </p>
            <p><strong>HTTPS:</strong> {window.location.protocol === 'https:' ? '✅ Yes' : '❌ No (may cause camera issues)'}</p>
          </IonText>
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
          <IonButton 
            expand="block" 
            onClick={requestPermissions}
            color="secondary"
            disabled={isLoading}
          >
            {isWeb ? '🎥 Request Web Camera' : '📷 Request Mobile Camera'}
          </IonButton>
          
          <IonButton 
            expand="block" 
            onClick={takePicture}
            disabled={isLoading || permissionStatus !== 'granted'}
            color="primary"
          >
            {isLoading ? '⏳ Processing...' : '📸 Take Photo & Detect'}
          </IonButton>
        </div>

        {/* Hidden video and canvas for web camera capture */}
        {isWeb && (
          <div style={{ display: 'none' }}>
            <video ref={videoRef} autoPlay playsInline />
            <canvas ref={canvasRef} />
          </div>
        )}

        {photoSrc && (
          <div style={{ textAlign: 'center', marginTop: '1rem' }}>
            <IonImg 
              src={photoSrc} 
              alt="Captured photo" 
              style={{ 
                maxWidth: '300px', 
                maxHeight: '200px', 
                border: '2px solid var(--ion-color-primary)',
                borderRadius: '8px'
              }}
            />
            <IonText color="medium">
              <p style={{ fontSize: '0.9em', marginTop: '0.5rem' }}>
                📷 Photo captured and sent to backend for analysis
              </p>
            </IonText>
          </div>
        )}

        <IonAlert
          isOpen={showAlert}
          onDidDismiss={() => setShowAlert(false)}
          header="🧪 Test Result"
          message={error || ''}
          buttons={['OK']}
        />
      </IonCardContent>
    </IonCard>
  );
};

export default CameraTest;