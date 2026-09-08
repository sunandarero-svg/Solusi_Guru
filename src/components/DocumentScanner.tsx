"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Webcam from "react-webcam";
import Script from "next/script";
import ReactCrop, { Crop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

// Declare global types for OpenCV and jscanify
declare global {
  interface Window {
    cv: any;
    jscanify: any;
  }
}

interface DocumentScannerProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
  allowGalleryUpload?: boolean;
}

export default function DocumentScanner({ onCapture, onClose, allowGalleryUpload = false }: DocumentScannerProps) {
  const [cvLoaded, setCvLoaded] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);
  const [scanner, setScanner] = useState<any>(null);
  
  const [mode, setMode] = useState<"camera" | "preview" | "manual-crop">("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [filterMode, setFilterMode] = useState<"bw" | "color">("bw");
  
  const webcamRef = useRef<Webcam>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Manual crop state
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    x: 10,
    y: 10,
    width: 80,
    height: 80
  });

  // Load jscanify dynamically after cv is loaded to avoid SSR issues
  useEffect(() => {
    if (cvLoaded && typeof window !== "undefined") {
      import("jscanify/client").then((module) => {
        window.jscanify = module.default;
        const jscanifyInstance = new module.default();
        setScanner(jscanifyInstance);
        setScannerReady(true);
      }).catch(err => {
        console.error("Failed to load jscanify", err);
      });
    }
  }, [cvLoaded]);

  const handleCapture = useCallback(() => {
    if (!webcamRef.current) return;
    const imageSrc = webcamRef.current.getScreenshot();
    if (imageSrc) {
      processCapturedImage(imageSrc);
    }
  }, [webcamRef, scannerReady]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          processCapturedImage(event.target.result as string);
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const processCapturedImage = (base64Str: string) => {
    setCapturedImage(base64Str);
    setIsProcessing(true);
    setMode("preview");

    if (!scannerReady || !scanner) {
      // Fallback to manual crop if OpenCV/jscanify isn't ready
      setIsProcessing(false);
      setMode("manual-crop");
      return;
    }

    const img = new Image();
    img.onload = () => {
      try {
        // Find paper contour and extract it
        const paperContour = scanner.findPaperContour(window.cv.imread(img));
        
        if (paperContour) {
          const resultCanvas = scanner.extractPaper(img, 1000, 1414); // Standard A4 aspect ratio 1:1.414
          applyFilter(resultCanvas, filterMode);
        } else {
          // No contour found, fallback to manual crop
          setIsProcessing(false);
          setMode("manual-crop");
        }
      } catch (error) {
        console.error("OpenCV processing error:", error);
        setIsProcessing(false);
        setMode("manual-crop");
      }
    };
    img.src = base64Str;
  };

  const applyFilter = (canvas: HTMLCanvasElement, currentFilter: "bw" | "color") => {
    try {
      const src = window.cv.imread(canvas);
      const dst = new window.cv.Mat();
      
      if (currentFilter === "bw") {
        window.cv.cvtColor(src, dst, window.cv.COLOR_RGBA2GRAY, 0);
        // Adaptive threshold to simulate scanner look
        window.cv.adaptiveThreshold(dst, dst, 255, window.cv.ADAPTIVE_THRESH_GAUSSIAN_C, window.cv.THRESH_BINARY, 15, 10);
      } else {
        // Color enhance: increase contrast/brightness slightly
        src.convertTo(dst, -1, 1.2, 10);
      }
      
      const outCanvas = document.createElement('canvas');
      window.cv.imshow(outCanvas, dst);
      
      setFinalImage(outCanvas.toDataURL("image/jpeg", 0.9));
      setIsProcessing(false);
      
      src.delete();
      dst.delete();
    } catch (err) {
      console.error("Filter error", err);
      // Fallback: just use raw canvas
      setFinalImage(canvas.toDataURL("image/jpeg", 0.9));
      setIsProcessing(false);
    }
  };

  const handleManualCrop = () => {
    if (!imageRef.current || !capturedImage) return;
    
    setIsProcessing(true);
    
    try {
      const canvas = document.createElement("canvas");
      const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
      const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
      
      canvas.width = crop.width * scaleX;
      canvas.height = crop.height * scaleY;
      
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(
          imageRef.current,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          crop.width * scaleX,
          crop.height * scaleY
        );
        
        // Pass to filter
        if (scannerReady) {
           applyFilter(canvas, filterMode);
        } else {
           setFinalImage(canvas.toDataURL("image/jpeg", 0.9));
           setIsProcessing(false);
        }
        setMode("preview");
      }
    } catch (e) {
      console.error("Manual crop failed", e);
      setIsProcessing(false);
    }
  };

  const toggleFilter = () => {
    const newMode = filterMode === "bw" ? "color" : "bw";
    setFilterMode(newMode);
    
    if (capturedImage && scannerReady) {
      setIsProcessing(true);
      // Re-run the extraction from original captured image
      const img = new Image();
      img.onload = () => {
        try {
           const paperContour = scanner.findPaperContour(window.cv.imread(img));
           if (paperContour) {
             const resultCanvas = scanner.extractPaper(img, 1000, 1414);
             applyFilter(resultCanvas, newMode);
           } else {
             // Use full image if contour fails
             const canvas = document.createElement("canvas");
             canvas.width = img.width;
             canvas.height = img.height;
             canvas.getContext("2d")?.drawImage(img, 0, 0);
             applyFilter(canvas, newMode);
           }
        } catch(e) {
           setIsProcessing(false);
        }
      };
      img.src = capturedImage;
    }
  };

  const confirmAndSave = () => {
    if (finalImage) {
      onCapture(finalImage);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <Script 
        src="https://docs.opencv.org/4.7.0/opencv.js" 
        strategy="lazyOnload"
        onLoad={() => {
          // OpenCV doesn't immediately initialize, need to wait for its internal readiness
          const checkCv = setInterval(() => {
            if (window.cv && window.cv.Mat) {
              clearInterval(checkCv);
              setCvLoaded(true);
            }
          }, 100);
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900 text-white shadow-md z-10">
        <button onClick={onClose} className="text-gray-400 hover:text-white px-3 py-1 font-medium">
          Batal
        </button>
        <span className="font-bold text-lg">
          {mode === "camera" ? "Pindai Dokumen" : mode === "manual-crop" ? "Sesuaikan Area" : "Pratinjau Hasil"}
        </span>
        <div className="w-16">
          {/* Spacer */}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col items-center justify-center bg-gray-950">
        
        {/* Loading Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-black/60 z-20 flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-emerald-400 mt-4 font-medium">Memproses Dokumen...</p>
          </div>
        )}

        {/* Camera Mode */}
        {mode === "camera" && (
          <div className="relative w-full h-full flex items-center justify-center">
            {!cvLoaded && (
              <div className="absolute top-4 left-0 right-0 flex justify-center z-10">
                <span className="bg-blue-600/80 backdrop-blur text-white px-4 py-1.5 rounded-full text-xs font-medium animate-pulse">
                  Memuat AI Scanner...
                </span>
              </div>
            )}
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: "environment", width: 1920, height: 1080 }}
              className="w-full h-full object-cover"
            />
            {/* Guide overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-8">
              <div className="w-full h-full border-2 border-emerald-500/50 rounded-lg relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-lg"></div>
              </div>
            </div>
            
            {/* Camera Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 flex justify-center items-center bg-gradient-to-t from-black via-black/80 to-transparent">
              <div className="flex items-center gap-12">
                {allowGalleryUpload ? (
                  <label className="text-white bg-gray-800 p-4 rounded-full cursor-pointer hover:bg-gray-700 transition">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                ) : <div className="w-14"></div>}
                
                <button 
                  onClick={handleCapture}
                  className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 flex items-center justify-center hover:bg-gray-200 transition-transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                  <div className="w-16 h-16 rounded-full border-2 border-black"></div>
                </button>

                <div className="w-14"></div> {/* Spacer balance */}
              </div>
            </div>
          </div>
        )}

        {/* Manual Crop Mode */}
        {mode === "manual-crop" && capturedImage && (
          <div className="w-full h-full flex flex-col">
            <div className="p-3 bg-yellow-600/20 text-yellow-500 text-sm font-medium text-center border-b border-yellow-600/30">
              ⚠️ Dokumen gagal dideteksi. Silakan potong manual.
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-900">
               <ReactCrop crop={crop} onChange={c => setCrop(c)}>
                 <img ref={imageRef} src={capturedImage} alt="Crop me" className="max-h-[70vh] object-contain shadow-2xl" />
               </ReactCrop>
            </div>
            <div className="p-4 bg-gray-950 flex justify-between">
              <button onClick={() => setMode("camera")} className="px-5 py-2.5 text-white bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition">Ulangi Foto</button>
              <button onClick={handleManualCrop} className="px-6 py-2.5 text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold shadow-lg shadow-emerald-600/20 transition">Terapkan Potongan</button>
            </div>
          </div>
        )}

        {/* Preview Mode */}
        {mode === "preview" && finalImage && (
          <div className="w-full h-full flex flex-col">
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-gray-950">
               <img src={finalImage} alt="Final Scanned" className="max-h-[75vh] object-contain shadow-2xl border border-gray-800" />
            </div>
            <div className="p-4 bg-gray-900 border-t border-gray-800 flex items-center justify-between">
               <button onClick={() => setMode("camera")} className="px-4 py-2 text-gray-300 hover:text-white font-medium">Foto Ulang</button>
               
               <button 
                  onClick={toggleFilter} 
                  className="flex items-center gap-2 px-5 py-2.5 bg-gray-800 rounded-full text-sm font-medium text-gray-200 hover:bg-gray-700 transition"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                 {filterMode === "bw" ? "B&W" : "Warna"}
               </button>

               <button onClick={confirmAndSave} className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition">
                 Simpan
               </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
