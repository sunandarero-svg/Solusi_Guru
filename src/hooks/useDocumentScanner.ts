import { useState, useEffect, useCallback } from 'react';

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

  const processImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!isReady || !scanner || !(window as any).cv) {
        return resolve(file); // Fallback ke file asli jika OpenCV belum siap
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageSrc = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
           try {
             const cv = (window as any).cv;
             // 1. Auto crop (Extract paper using jscanify)
             const extractedCanvas = scanner.extractPaper(img, 1080, 1920);
             
             // Pastikan hasil ekstraksi masuk akal, jika tidak gunakan gambar asli
             const sourceImage = (extractedCanvas && extractedCanvas.width > 100) ? extractedCanvas : img;

             // 2. Black and white filter with Adaptive Thresholding
             const mat = cv.imread(sourceImage);
             
             // Convert to grayscale
             cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY, 0);

             // Apply adaptive thresholding to remove shadow and keep text sharp
             // blockSize=21, C=10 are typical good values for document scanning
             cv.adaptiveThreshold(mat, mat, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 21, 10);

             // Tulis kembali ke canvas
             const resultCanvas = document.createElement('canvas');
             cv.imshow(resultCanvas, mat);
             mat.delete();

             // Konversi kembali ke File
             resultCanvas.toBlob((blob) => {
               if (blob) {
                 const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + "_scanned.jpg", {
                   type: "image/jpeg",
                   lastModified: Date.now(),
                 });
                 resolve(newFile);
               } else {
                 resolve(file);
               }
             }, "image/jpeg", 0.85);

           } catch(error) {
             console.error("OpenCV processing failed", error);
             resolve(file); // fallback
           }
        };
        img.onerror = () => resolve(file);
        img.src = imageSrc;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }, [isReady, scanner]);

  return { isReady, processImage };
}
