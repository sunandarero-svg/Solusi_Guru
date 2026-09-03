import sharp from "sharp";
import { AIErrorHighlight } from "./AIProvider";

/**
 * Draws red translucent rectangles on an image based on AI bounding boxes.
 * @param imageBuffer Original image buffer
 * @param highlights Array of highlights containing bounding boxes [ymin, xmin, ymax, xmax] (0-1000 scale)
 * @returns Buffer of the new highlighted image
 */
export async function drawHighlights(imageBuffer: Buffer, highlights: AIErrorHighlight[]): Promise<Buffer> {
  const image = sharp(imageBuffer);
  const metadata = await image.metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not determine image dimensions");
  }

  const { width, height } = metadata;

  // Generate SVG string with rects
  let svgRects = '';
  for (const hl of highlights) {
    const [ymin, xmin, ymax, xmax] = hl.box;
    
    // Convert 0-1000 scale to actual pixels
    const x = (xmin / 1000) * width;
    const y = (ymin / 1000) * height;
    const w = ((xmax - xmin) / 1000) * width;
    const h = ((ymax - ymin) / 1000) * height;

    // A red semi-transparent rectangle (Stabilo effect)
    svgRects += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="rgba(255, 0, 0, 0.3)" stroke="rgba(255, 0, 0, 0.8)" stroke-width="2" />`;
    
    // Add text label for correction (optional, but good for context)
    svgRects += `<text x="${x}" y="${y - 5}" font-family="Arial" font-size="${Math.max(16, h/2)}" fill="red" font-weight="bold">${hl.correction}</text>`;
  }

  const svgImage = `
    <svg width="${width}" height="${height}">
      ${svgRects}
    </svg>
  `;

  return await image
    .composite([
      {
        input: Buffer.from(svgImage),
        top: 0,
        left: 0,
      },
    ])
    .toBuffer();
}
