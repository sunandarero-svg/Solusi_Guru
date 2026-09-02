import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { readFile } from "fs/promises";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await props.params;
    const filePathArray = resolvedParams.path;
    
    const absolutePath = path.join(process.cwd(), "public", "uploads", ...filePathArray);
    
    let contentType = "application/octet-stream";
    const ext = path.extname(absolutePath).toLowerCase();
    if (ext === ".pdf") contentType = "application/pdf";
    else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";

    try {
      const fileBuffer = await readFile(absolutePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch (err) {
      return new NextResponse("File not found", { status: 404 });
    }
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
