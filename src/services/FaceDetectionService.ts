import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import type { Detection } from "@mediapipe/tasks-vision";

let faceDetector: FaceDetector | null = null;
let hasFailedInit = false;

export const initializeFaceDetector = async () => {
    if (faceDetector) return faceDetector;
    if (hasFailedInit) return null; // Don't retry if already failed

    try {
        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );

        faceDetector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
                delegate: "GPU"
            },
            runningMode: "IMAGE"
        });

        return faceDetector;
    } catch (error) {
        console.warn("MediaPipe Face Detector failed to initialize. Feature disabled.", error);
        hasFailedInit = true; // Mark as failed to prevent future attempts
        return null;
    }
};

export interface FaceResult {
    center: { x: number, y: number };
    detection: Detection;
    originalWidth: number;
    originalHeight: number;
}

export const detectFace = async (url: string): Promise<FaceResult | null> => {
  return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = async () => {
          try {
             const detector = await initializeFaceDetector();
             if (!detector) {
                 resolve(null);
                 return;
             }
             
             const detections = detector.detect(img);
             
             if (detections.detections.length > 0) {
                 // Pick the first face (usually the most prominent)
                 const detection = detections.detections[0];
                 const box = detection.boundingBox!;
                 
                 // Calculate absolute center in image coordinates
                 const centerX = box.originX + box.width / 2;
                 const centerY = box.originY + box.height / 2;
                 
                 resolve({ 
                     center: { x: centerX, y: centerY }, 
                     detection,
                     originalWidth: img.width,
                     originalHeight: img.height
                 });
             } else {
                 resolve(null);
             }
          } catch (e) {
              console.error("Detection failed", e);
              // Fallback: resolve null so app doesn't crash
              resolve(null);
          }
      };
      img.onerror = (e) => reject(e);
      img.src = url;
  });
};
