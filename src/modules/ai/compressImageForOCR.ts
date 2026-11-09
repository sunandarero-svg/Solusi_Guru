import sharp from "sharp";

/**
 * Compress an image Buffer for OCR to minimize AI token usage.
 * 
 * Strategy:
 * - Resize to max 1024px (sufficient for OCR text recognition)
 * - Convert to JPEG with quality 65 (text remains sharp)
 * - Convert to grayscale (removes color info, saves ~60% tokens, OCR doesn't need color)
 * 
 * Typical savings: 500KB+ image → ~50-80KB compressed
 * Token savings: ~60-70% fewer vision tokens
 */
export async function compressBufferForOCR(
  inputBuffer: Buffer,
  mimeType: string = "image/jpeg"
): Promise<{ compressedBuffer: Buffer; compressedBase64: string; compressedMimeType: string; savings: string }> {
  try {
    const originalSize = inputBuffer.length;
    const metadata = await sharp(inputBuffer).metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;

    let pipeline = sharp(inputBuffer);

    // Resize to max 1024px width/height — sweet spot for OCR readability vs token cost
    const MAX_DIMENSION = 1024;
    if (originalWidth > MAX_DIMENSION || originalHeight > MAX_DIMENSION) {
      pipeline = pipeline.resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Convert to grayscale — text OCR doesn't need color, saves significant tokens
    pipeline = pipeline.grayscale();

    // Normalize (auto-level contrast) — helps with handwritten text on various backgrounds
    pipeline = pipeline.normalize();

    // Output as JPEG quality 65 — sharp enough for text, small file size
    const compressedBuffer = await pipeline
      .jpeg({ quality: 65, mozjpeg: true })
      .toBuffer();

    const compressedBase64 = compressedBuffer.toString("base64");
    const compressedSize = compressedBuffer.length;

    const savedPercent = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    const savings = `${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB (hemat ${savedPercent}%)`;

    console.log(`[OCR Compress] ${savings} | ${originalWidth}x${originalHeight} → max ${MAX_DIMENSION}px grayscale JPEG`);

    return {
      compressedBuffer,
      compressedBase64,
      compressedMimeType: "image/jpeg",
      savings,
    };
  } catch (err) {
    console.warn("[OCR Compress] Kompresi buffer gagal, menggunakan data original:", err);
    return {
      compressedBuffer: inputBuffer,
      compressedBase64: inputBuffer.toString("base64"),
      compressedMimeType: mimeType,
      savings: "0% (fallback - kompresi gagal)",
    };
  }
}

/**
 * Compress a base64 image for OCR to minimize AI token usage.
 */
export async function compressImageForOCR(
  base64Data: string, 
  mimeType: string
): Promise<{ compressedBase64: string; compressedMimeType: string; savings: string }> {
  const inputBuffer = Buffer.from(base64Data, "base64");
  const res = await compressBufferForOCR(inputBuffer, mimeType);
  return {
    compressedBase64: res.compressedBase64,
    compressedMimeType: res.compressedMimeType,
    savings: res.savings,
  };
}
