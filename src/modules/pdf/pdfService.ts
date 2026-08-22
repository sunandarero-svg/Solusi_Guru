import { prisma } from "@/lib/prisma";
import { PDFDocument } from "pdf-lib";
import { readFile, mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export const pdfService = {
  async generatePDFFromSubmission(submissionId: string) {
    // 1. Fetch submission and its pages
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' }
        }
      }
    });

    if (!submission || submission.pages.length === 0) {
      throw new Error("Submission not found or has no pages.");
    }

    // 2. Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // 3. Process each page
    for (const pageRecord of submission.pages) {
      const publicPath = pageRecord.storageKey; // e.g. /uploads/submissions/xxx.jpg
      const absolutePath = path.join(process.cwd(), "public", publicPath);

      try {
        const imageBytes = await readFile(absolutePath);
        let image;

        // Determine type and embed
        if (pageRecord.mimeType === "image/png" || absolutePath.toLowerCase().endsWith(".png")) {
          image = await pdfDoc.embedPng(imageBytes);
        } else {
          // Assume JPEG for everything else (including webp if converted, though pdf-lib only supports JPG/PNG)
          // Note: HTML Canvas toDataURL("image/jpeg") generates JPEGs.
          image = await pdfDoc.embedJpg(imageBytes);
        }

        const dims = image.scale(1);
        const page = pdfDoc.addPage([dims.width, dims.height]);
        page.drawImage(image, {
          x: 0,
          y: 0,
          width: dims.width,
          height: dims.height,
        });
      } catch (err) {
        console.error(`Failed to process page ${pageRecord.id}:`, err);
        // Continue even if one page fails, or throw. For now, continue to not block the whole document.
      }
    }

    // 4. Serialize the PDFDocument to bytes
    const pdfBytes = await pdfDoc.save();

    // 5. Save PDF locally
    const uploadDir = path.join(process.cwd(), "public", "uploads", "documents");
    await mkdir(uploadDir, { recursive: true });

    const filename = `${submissionId}-${crypto.randomUUID()}.pdf`;
    const filePath = path.join(uploadDir, filename);

    await writeFile(filePath, pdfBytes);

    // 6. Record metadata in SubmissionDocument table
    const storageKey = `/uploads/documents/${filename}`;
    const fileSize = pdfBytes.length;

    const submissionDocument = await prisma.submissionDocument.create({
      data: {
        submissionId: submissionId,
        storageKey,
        fileSize,
        pageCount: submission.pages.length,
      }
    });

    return submissionDocument;
  }
};
