"use client";

import { useEffect, useRef, useState } from "react";

interface ImagePreviewModalProps {
  imageUrl: string;
  onClose: () => void;
  onRotate: (newImageUrl: string) => void;
  onDelete: () => void;
}

export default function ImagePreviewModal({ imageUrl, onClose, onRotate, onDelete }: ImagePreviewModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(imageUrl);

  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleRotate = () => {
    setLoading(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = currentImage;
    img.onload = () => {
      // Rotate 90 degrees clockwise
      canvas.width = img.height;
      canvas.height = img.width;
      
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);

      const rotatedImageUrl = canvas.toDataURL("image/jpeg", 0.9);
      setCurrentImage(rotatedImageUrl);
      onRotate(rotatedImageUrl);
      setLoading(false);
    };
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 p-4">
      <div className="relative w-full max-w-lg flex flex-col h-full max-h-screen">
        <div className="flex justify-between items-center p-4 text-white">
          <span className="font-semibold text-lg">Pratinjau Halaman</span>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
            ✕ Tutup
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center overflow-hidden relative p-4">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
              <span className="text-white">Memproses...</span>
            </div>
          )}
          <img 
            src={currentImage} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain"
          />
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>

        <div className="p-6 pb-12 flex justify-center space-x-6">
          <button 
            onClick={handleRotate}
            className="flex flex-col items-center text-white p-3 hover:bg-gray-800 rounded-xl transition"
          >
            <span className="text-2xl mb-1">↻</span>
            <span className="text-xs">Putar</span>
          </button>

          <button 
            onClick={() => {
              if (confirm("Hapus halaman ini?")) {
                onDelete();
              }
            }}
            className="flex flex-col items-center text-red-500 p-3 hover:bg-gray-800 rounded-xl transition"
          >
            <span className="text-2xl mb-1">🗑️</span>
            <span className="text-xs">Hapus</span>
          </button>
        </div>
      </div>
    </div>
  );
}

