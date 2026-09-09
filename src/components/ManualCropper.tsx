"use client";

import React, { useState, useEffect, useRef } from "react";

export interface Point {
  x: number;
  y: number;
}

export interface CornerPoints {
  topLeftCorner: Point;
  topRightCorner: Point;
  bottomLeftCorner: Point;
  bottomRightCorner: Point;
}

interface ManualCropperProps {
  imageSrc: string;
  initialCorners: CornerPoints | null;
  onCrop: (corners: CornerPoints) => void;
  onCancel: () => void;
}

export default function ManualCropper({ imageSrc, initialCorners, onCrop, onCancel }: ManualCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const [corners, setCorners] = useState<CornerPoints | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0, x: 0, y: 0 });
  const [draggingPoint, setDraggingPoint] = useState<keyof CornerPoints | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      if (initialCorners) {
        setCorners(initialCorners);
      } else {
        // Default corners if none provided (e.g. OpenCV failed to find contour)
        const paddingX = img.naturalWidth * 0.1;
        const paddingY = img.naturalHeight * 0.1;
        setCorners({
          topLeftCorner: { x: paddingX, y: paddingY },
          topRightCorner: { x: img.naturalWidth - paddingX, y: paddingY },
          bottomLeftCorner: { x: paddingX, y: img.naturalHeight - paddingY },
          bottomRightCorner: { x: img.naturalWidth - paddingX, y: img.naturalHeight - paddingY },
        });
      }
    };
    img.src = imageSrc;
  }, [imageSrc, initialCorners]);

  useEffect(() => {
    const updateLayout = () => {
      if (imageRef.current && containerRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        setDisplaySize({ 
          width: rect.width, 
          height: rect.height,
          x: rect.left - containerRect.left,
          y: rect.top - containerRect.top
        });
      }
    };
    window.addEventListener("resize", updateLayout);
    // Add small delay to ensure image is rendered and layout is calculated
    const timeout = setTimeout(updateLayout, 150);
    return () => {
      window.removeEventListener("resize", updateLayout);
      clearTimeout(timeout);
    };
  }, [imageSize]);

  // Convert image coordinate to screen coordinate
  const toScreen = (p: Point) => {
    if (imageSize.width === 0) return { x: 0, y: 0 };
    return {
      x: displaySize.x + (p.x / imageSize.width) * displaySize.width,
      y: displaySize.y + (p.y / imageSize.height) * displaySize.height
    };
  };

  // Convert screen coordinate to image coordinate
  const toImage = (clientX: number, clientY: number) => {
    if (!containerRef.current || imageSize.width === 0) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const xOnContainer = clientX - rect.left;
    const yOnContainer = clientY - rect.top;
    
    let imgX = ((xOnContainer - displaySize.x) / displaySize.width) * imageSize.width;
    let imgY = ((yOnContainer - displaySize.y) / displaySize.height) * imageSize.height;
    
    // Clamp to image bounds
    imgX = Math.max(0, Math.min(imageSize.width, imgX));
    imgY = Math.max(0, Math.min(imageSize.height, imgY));
    
    return { x: imgX, y: imgY };
  };

  const handlePointerDown = (e: React.PointerEvent, pointName: keyof CornerPoints) => {
    e.preventDefault();
    setDraggingPoint(pointName);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingPoint || !corners) return;
    const newPoint = toImage(e.clientX, e.clientY);
    setCorners({ ...corners, [draggingPoint]: newPoint });
  };

  const handlePointerUp = () => {
    setDraggingPoint(null);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      <div className="flex justify-between items-center p-4 bg-gray-900 shadow-md">
        <button onClick={onCancel} className="text-gray-400 hover:text-white px-3 py-1 font-medium">Batal</button>
        <span className="text-white font-bold">Sesuaikan Potongan</span>
        <button 
          onClick={() => corners && onCrop(corners)}
          className="bg-emerald-600 px-4 py-2 rounded-full text-white font-medium text-sm hover:bg-emerald-500 transition-colors"
        >
          Lanjut
        </button>
      </div>

      <div 
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-gray-950 flex items-center justify-center p-4 touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <img 
          ref={imageRef}
          src={imageSrc} 
          alt="To be cropped" 
          className="max-w-full max-h-full object-contain pointer-events-none select-none"
          onLoad={() => {
            window.dispatchEvent(new Event('resize'));
          }}
        />

        {corners && displaySize.width > 0 && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {/* Dark overlay outside the crop area */}
            <defs>
              <mask id="crop-mask">
                <rect width="100%" height="100%" fill="white" />
                <polygon 
                  points={`
                    ${toScreen(corners.topLeftCorner).x},${toScreen(corners.topLeftCorner).y} 
                    ${toScreen(corners.topRightCorner).x},${toScreen(corners.topRightCorner).y} 
                    ${toScreen(corners.bottomRightCorner).x},${toScreen(corners.bottomRightCorner).y} 
                    ${toScreen(corners.bottomLeftCorner).x},${toScreen(corners.bottomLeftCorner).y}
                  `}
                  fill="black" 
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#crop-mask)" />
            
            {/* Polygon Outline */}
            <polygon 
              points={`
                ${toScreen(corners.topLeftCorner).x},${toScreen(corners.topLeftCorner).y} 
                ${toScreen(corners.topRightCorner).x},${toScreen(corners.topRightCorner).y} 
                ${toScreen(corners.bottomRightCorner).x},${toScreen(corners.bottomRightCorner).y} 
                ${toScreen(corners.bottomLeftCorner).x},${toScreen(corners.bottomLeftCorner).y}
              `}
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            />
          </svg>
        )}

        {/* Draggable Handles */}
        {corners && displaySize.width > 0 && (
          <>
            {(Object.keys(corners) as Array<keyof CornerPoints>).map((key) => {
              const pos = toScreen(corners[key]);
              return (
                <div
                  key={key}
                  onPointerDown={(e) => handlePointerDown(e, key)}
                  className="absolute w-12 h-12 -ml-6 -mt-6 rounded-full flex items-center justify-center cursor-move touch-none z-20"
                  style={{ left: pos.x, top: pos.y }}
                >
                  <div className="w-6 h-6 bg-white border-4 border-emerald-500 rounded-full shadow-lg" />
                </div>
              );
            })}
          </>
        )}
      </div>
      
      <div className="p-4 bg-gray-900 text-center">
        <p className="text-gray-400 text-sm">Geser 4 sudut di atas agar pas dengan ujung kertas Anda.</p>
      </div>
    </div>
  );
}
