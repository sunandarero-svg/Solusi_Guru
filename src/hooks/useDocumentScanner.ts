import { useState, useEffect, useCallback } from 'react';
import { CornerPoints } from '@/components/ManualCropper';

export function useDocumentScanner() {
  const [isReady, setIsReady] = useState(false);
  const [scanner, setScanner] = useState<any>(null);

  useEffect(() => {
    // Check if OpenCV is already loaded
    if (document.getElementById('opencv-script') || (window as any).cv) {
       if ((window as any).cv) {
         initScanner();
       } else {
         // Script is loaded but cv might not be fully initialized yet
         const checkCv = setInterval(() => {
           if ((window as any).cv && (window as any).cv.Mat) {
             clearInterval(checkCv);
             initScanner();
           }
         }, 100);
       }
       return;
    }

    const script = document.createElement('script');
    script.id = 'opencv-script';
    script.src = 'https://docs.opencv.org/4.7.0/opencv.js';
    script.async = true;
    script.onload = () => {
       const checkCv = setInterval(() => {
         if ((window as any).cv && (window as any).cv.Mat) {
           clearInterval(checkCv);
           initScanner();
         }
       }, 100);
    };
    document.body.appendChild(script);
  }, []);

  const initScanner = async () => {
    try {
      // Dynamically import jscanify client version
      const jscanifyModule = await import('jscanify/client');
      const Jscanify = jscanifyModule.default || jscanifyModule;
      setScanner(new Jscanify());
      setIsReady(true);
    } catch (e) {
      console.error("Gagal memuat jscanify", e);
    }
  };

  const detectCorners = useCallback(async (imageSrc: string): Promise<CornerPoints | null> => {
    return new Promise((resolve) => {
      if (!isReady || !scanner || !(window as any).cv) return resolve(null);
      const img = new Image();
      img.onload = () => {
         try {
           const cv = (window as any).cv;
           const cvMat = cv.imread(img);
           const contour = scanner.findPaperContour(cvMat);
           if (contour) {
             const cornerPoints = scanner.getCornerPoints(contour);
             
             // Tambahkan sedikit margin secara default agar tidak terpotong
             const margin = 20; 
             const w = cvMat.cols;
             const h = cvMat.rows;
             
             if (cornerPoints.topLeftCorner && cornerPoints.topRightCorner && cornerPoints.bottomLeftCorner && cornerPoints.bottomRightCorner) {
                cornerPoints.topLeftCorner.x = Math.max(0, cornerPoints.topLeftCorner.x - margin);
                cornerPoints.topLeftCorner.y = Math.max(0, cornerPoints.topLeftCorner.y - margin);
                
                cornerPoints.topRightCorner.x = Math.min(w, cornerPoints.topRightCorner.x + margin);
                cornerPoints.topRightCorner.y = Math.max(0, cornerPoints.topRightCorner.y - margin);
                
                cornerPoints.bottomLeftCorner.x = Math.max(0, cornerPoints.bottomLeftCorner.x - margin);
                cornerPoints.bottomLeftCorner.y = Math.min(h, cornerPoints.bottomLeftCorner.y + margin);
                
                cornerPoints.bottomRightCorner.x = Math.min(w, cornerPoints.bottomRightCorner.x + margin);
                cornerPoints.bottomRightCorner.y = Math.min(h, cornerPoints.bottomRightCorner.y + margin);
                
                cvMat.delete();
                contour.delete();
                resolve(cornerPoints);
             } else {
                cvMat.delete();
                contour.delete();
                resolve(null);
             }
           } else {
             cvMat.delete();
             resolve(null);
           }
         } catch (e) {
           console.error("OpenCV detection failed", e);
           resolve(null);
         }
      };
      img.onerror = () => resolve(null);
      img.src = imageSrc;
    });
  }, [isReady, scanner]);

  const processImage = useCallback(async (imageSrc: string, corners: CornerPoints | null, originalFilename: string): Promise<File> => {
     return new Promise((resolve) => {
       if (!isReady || !scanner || !(window as any).cv) {
          // Fallback tanpa OpenCV
          fetch(imageSrc).then(r => r.blob()).then(blob => {
             resolve(new File([blob], originalFilename, { type: "image/jpeg" }));
          });
          return;
       }

       const img = new Image();
       img.onload = () => {
          try {
             const cv = (window as any).cv;
             
             let extractedCanvas = null;
             if (corners) {
                extractedCanvas = scanner.extractPaper(img, 1080, 1920, corners);
             } else {
                extractedCanvas = scanner.extractPaper(img, 1080, 1920); // Fallback auto-crop
             }
             
             const sourceImage = (extractedCanvas && extractedCanvas.width > 100) ? extractedCanvas : img;

             const mat = cv.imread(sourceImage);
             cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY, 0);
             cv.adaptiveThreshold(mat, mat, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 21, 10);

             const resultCanvas = document.createElement('canvas');
             cv.imshow(resultCanvas, mat);
             mat.delete();

             resultCanvas.toBlob((blob) => {
               if (blob) {
                 const newFile = new File([blob], originalFilename.replace(/\.[^/.]+$/, "") + "_scanned.jpg", {
                   type: "image/jpeg",
                   lastModified: Date.now(),
                 });
                 resolve(newFile);
               } else {
                 fetch(imageSrc).then(r => r.blob()).then(b => resolve(new File([b], originalFilename, { type: "image/jpeg" })));
               }
             }, "image/jpeg", 0.85);

          } catch(e) {
             console.error("OpenCV processing failed", e);
             fetch(imageSrc).then(r => r.blob()).then(b => resolve(new File([b], originalFilename, { type: "image/jpeg" })));
          }
       };
       img.onerror = () => {
         fetch(imageSrc).then(r => r.blob()).then(b => resolve(new File([b], originalFilename, { type: "image/jpeg" })));
       };
       img.src = imageSrc;
     });
  }, [isReady, scanner]);

  return { isReady, detectCorners, processImage };
}
