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
  mimeType: string = "image/jpeg",
  maxDimension: number = 1600
): Promise<{ compressedBuffer: Buffer; compressedBase64: string; compressedMimeType: string; savings: string }> {
  try {
    const originalSize = inputBuffer.length;
    const metadata = await sharp(inputBuffer).metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;

    let pipeline = sharp(inputBuffer);

    // 1. Auto-orient berdasarkan EXIF orientation tag (SANGAT KRUSIAL untuk foto smartphone!)
    pipeline = pipeline.rotate();

    // 2. Resize ke resolusi tinggi (default 1600px) agar goresan pena tulisan tangan tetap tajam dan jelas
    const MAX_DIMENSION = maxDimension;
    if (originalWidth > MAX_DIMENSION || originalHeight > MAX_DIMENSION) {
      pipeline = pipeline.resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // 3. PERTAHANKAN WARNA ASLI (RGB): Jangan gunakan grayscale!
    // Warna tinta pulpen (biru/hitam) sangat penting bagi model vision AI untuk membedakan tulisan siswa dari garis buku tulis.

    // 4. Pertajam goresan tinta tulisan tangan tanpa mempertegas garis buku tulis
    // m1 rendah (0.1) menjaga agar garis horizontal buku tulis tidak menebal menjadi garis tengah huruf (seperti C disangka E)
    // m2 (1.2) memperjelas tepian tinta pena
    pipeline = pipeline.sharpen({ sigma: 0.8, m1: 0.1, m2: 1.2 });

    // 5. Output JPEG berkualitas tinggi (85) dengan mozjpeg agar tidak ada artifak blur
    const compressedBuffer = await pipeline
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();

    const compressedBase64 = compressedBuffer.toString("base64");
    const compressedSize = compressedBuffer.length;

    const savedPercent = ((1 - compressedSize / originalSize) * 100).toFixed(1);
    const savings = `${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB (hemat ${savedPercent}%)`;

    console.log(`[OCR Compress] ${savings} | ${originalWidth}x${originalHeight} → max ${MAX_DIMENSION}px high-res JPEG (RGB Color preserved)`);

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
 * Compress a base64 image for OCR to minimize AI token usage while preserving handwriting clarity.
 */
export async function compressImageForOCR(
  base64Data: string, 
  mimeType: string,
  maxDimension: number = 1600
): Promise<{ compressedBase64: string; compressedMimeType: string; savings: string }> {
  const inputBuffer = Buffer.from(base64Data, "base64");
  const res = await compressBufferForOCR(inputBuffer, mimeType, maxDimension);
  return {
    compressedBase64: res.compressedBase64,
    compressedMimeType: res.compressedMimeType,
    savings: res.savings,
  };
}
