import { useState, useCallback, useRef } from 'react';
import { ImageSegmenter, FilesetResolver } from '@mediapipe/tasks-vision';

interface UseBackgroundRemovalResult {
  removeBackground: (imageUrl: string) => Promise<string>;
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

// Singleton for the segmenter
let segmenterInstance: ImageSegmenter | null = null;
let segmenterPromise: Promise<ImageSegmenter> | null = null;

async function getSegmenter(onProgress: (progress: number) => void): Promise<ImageSegmenter> {
  if (segmenterInstance) return segmenterInstance;
  
  if (segmenterPromise) return segmenterPromise;
  
  segmenterPromise = (async () => {
    onProgress(10);
    
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    
    onProgress(50);
    
    const segmenter = await ImageSegmenter.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite',
        delegate: 'GPU'
      },
      runningMode: 'IMAGE',
      outputCategoryMask: true,
      outputConfidenceMasks: false
    });
    
    onProgress(100);
    segmenterInstance = segmenter;
    return segmenter;
  })();
  
  return segmenterPromise;
}

export function useBackgroundRemoval(): UseBackgroundRemovalResult {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const processImage = useCallback(async (imageUrl: string): Promise<string> => {
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Get or create segmenter
      const segmenter = await getSegmenter(setProgress);
      
      // Load image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
      });

      // Create canvas for processing
      if (!canvasRef.current) {
        canvasRef.current = document.createElement('canvas');
      }
      const canvas = canvasRef.current;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Canvas context failed');
      
      // Draw original image
      ctx.drawImage(img, 0, 0);
      
      // Get segmentation mask
      const result = segmenter.segment(img);
      
      if (!result.categoryMask) {
        throw new Error('No segmentation mask returned');
      }
      
      const mask = result.categoryMask;
      const maskData = mask.getAsUint8Array();
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Apply mask - for selfie_multiclass model:
      // Category 0 = background
      // Category 1-5 = different body parts (hair, body, face, clothes, etc.)
      // We want to KEEP non-zero categories (person) and REMOVE category 0 (background)
      const maskWidth = mask.width;
      const maskHeight = mask.height;
      
      // Debug: count categories to understand the mask
      const categoryCounts: Record<number, number> = {};
      for (let i = 0; i < maskData.length; i++) {
        categoryCounts[maskData[i]] = (categoryCounts[maskData[i]] || 0) + 1;
      }
      console.log('Category distribution:', categoryCounts);
      
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const imgIdx = (y * canvas.width + x) * 4;
          
          // Map coordinates to mask
          const maskX = Math.floor(x * maskWidth / canvas.width);
          const maskY = Math.floor(y * maskHeight / canvas.height);
          const maskIdx = maskY * maskWidth + maskX;
          
          const category = maskData[maskIdx];
          
          // If background (category 0), make transparent
          // Keep all non-zero categories (person parts)
          if (category === 0) {
            data[imgIdx + 3] = 0; // Set alpha to 0
          }
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
      
      // Convert to blob and URL
      const blob = await new Promise<Blob | null>(resolve => 
        canvas.toBlob(resolve, 'image/png')
      );
      
      if (!blob) throw new Error('Failed to create image blob');
      
      // Cleanup
      mask.close();
      
      const resultUrl = URL.createObjectURL(blob);
      
      setIsProcessing(false);
      setProgress(100);
      return resultUrl;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setIsProcessing(false);
      throw err;
    }
  }, []);

  return {
    removeBackground: processImage,
    isProcessing,
    progress,
    error,
  };
}




