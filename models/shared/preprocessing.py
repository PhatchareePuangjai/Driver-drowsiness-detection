# Shared Preprocessing Utilities

import cv2
import numpy as np
from PIL import Image
import torch
import torchvision.transforms as transforms

class ImagePreprocessor:
    """
    Image preprocessing utilities for drowsiness detection models
    """
    
    def __init__(self, target_size=(640, 640)):
        self.target_size = target_size
        
        # Standard transforms for PyTorch models
        self.transform = transforms.Compose([
            transforms.Resize(target_size),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                               std=[0.229, 0.224, 0.225])
        ])
    
    def resize_image(self, image, size=None):
        """
        Resize image while maintaining aspect ratio
        
        Args:
            image: Input image (numpy array or PIL Image)
            size: Target size (width, height)
            
        Returns:
            resized_image: Resized image
        """
        if size is None:
            size = self.target_size
            
        if isinstance(image, np.ndarray):
            image = cv2.resize(image, size)
        else:
            image = image.resize(size, Image.LANCZOS)
            
        return image
    
    def normalize_image(self, image):
        """
        Normalize image pixel values to [0, 1]
        
        Args:
            image: Input image (numpy array)
            
        Returns:
            normalized_image: Normalized image
        """
        return image.astype(np.float32) / 255.0
    
    def preprocess_for_model(self, image, model_type='yolo'):
        """
        Preprocess image for specific model type
        
        Args:
            image: Input image
            model_type: Type of model ('yolo', 'faster_rcnn', 'vgg16')
            
        Returns:
            processed_image: Preprocessed image tensor
        """
        if model_type == 'yolo':
            # YOLO preprocessing
            if isinstance(image, np.ndarray):
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                image = self.resize_image(image)
                image = self.normalize_image(image)
                image = torch.from_numpy(image).permute(2, 0, 1).float()
            
        elif model_type in ['faster_rcnn', 'vgg16']:
            # Standard PyTorch preprocessing
            if isinstance(image, np.ndarray):
                image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
                image = Image.fromarray(image)
            
            image = self.transform(image)
            
        return image
    
    def enhance_image(self, image, brightness=1.0, contrast=1.0):
        """
        Enhance image brightness and contrast
        
        Args:
            image: Input image (numpy array)
            brightness: Brightness factor
            contrast: Contrast factor
            
        Returns:
            enhanced_image: Enhanced image
        """
        # Convert to float32 for processing
        image = image.astype(np.float32)
        
        # Apply brightness and contrast
        image = cv2.convertScaleAbs(image, alpha=contrast, beta=brightness)
        
        return image
    
    def detect_face_region(self, image):
        """
        Detect face region using OpenCV Haar Cascade
        
        Args:
            image: Input image
            
        Returns:
            face_region: Cropped face region or None if no face detected
            bbox: Bounding box coordinates (x, y, w, h)
        """
        # Load face cascade classifier
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        
        # Convert to grayscale for detection
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image
            
        # Detect faces
        faces = face_cascade.detectMultiScale(
            gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30)
        )
        
        if len(faces) > 0:
            # Return the largest face
            x, y, w, h = max(faces, key=lambda face: face[2] * face[3])
            face_region = image[y:y+h, x:x+w]
            return face_region, (x, y, w, h)
        
        return None, None

def create_data_loader(dataset, batch_size=32, shuffle=True, num_workers=4):
    """
    Create PyTorch DataLoader
    
    Args:
        dataset: PyTorch Dataset object
        batch_size: Batch size
        shuffle: Whether to shuffle data
        num_workers: Number of worker processes
        
    Returns:
        dataloader: PyTorch DataLoader
    """
    return torch.utils.data.DataLoader(
        dataset,
        batch_size=batch_size,
        shuffle=shuffle,
        num_workers=num_workers,
        pin_memory=torch.cuda.is_available()
    )

def calculate_accuracy(predictions, targets):
    """
    Calculate classification accuracy
    
    Args:
        predictions: Model predictions
        targets: Ground truth labels
        
    Returns:
        accuracy: Classification accuracy
    """
    if isinstance(predictions, torch.Tensor):
        predictions = predictions.detach().cpu().numpy()
    if isinstance(targets, torch.Tensor):
        targets = targets.detach().cpu().numpy()
        
    # Get predicted classes
    pred_classes = np.argmax(predictions, axis=1) if predictions.ndim > 1 else predictions
    
    # Calculate accuracy
    accuracy = np.mean(pred_classes == targets)
    
    return accuracy