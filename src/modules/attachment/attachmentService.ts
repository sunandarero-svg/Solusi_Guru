import dbConnect from "@/lib/mongoose";
import { Assignment, AssignmentAttachment } from "@/models/Assignment";
import { mapId } from "@/lib/mapId";
import path from "path";
import { readFile, writeFile, mkdir, unlink } from "fs/promises";

// Maximum file size: 300KB
export const MAX_ATTACHMENT_SIZE = 300 * 1024;
export const MAX_ATTACHMENTS_PER_ASSIGNMENT = 5;

export const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

export const attachmentService = {
  /**
   * Get all attachments for an assignment
   */
  async getAttachmentsByAssignment(assignmentId: string) {
    await dbConnect();
    const attachments = await AssignmentAttachment.find({ assignmentId })
      .sort({ order: 1 })
      .lean();
    return mapId(attachments);
  },

  /**
   * Create a new attachment from an uploaded file
   */
  async createAttachment(
    assignmentId: string,
    teacherId: string,
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
  ) {
    await dbConnect();

    // Validate assignment ownership
    const assignment = await Assignment.findById(assignmentId).select("teacherId").lean();
    if (!assignment || assignment.teacherId.toString() !== teacherId.toString()) {
      throw new Error("Unauthorized or Assignment not found");
    }

    // Check attachment count
    const existingCount = await AssignmentAttachment.countDocuments({ assignmentId });
    if (existingCount >= MAX_ATTACHMENTS_PER_ASSIGNMENT) {
      throw new Error(`Maksimal ${MAX_ATTACHMENTS_PER_ASSIGNMENT} lampiran per tugas.`);
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES[mimeType]) {
      throw new Error("Tipe file tidak didukung. Gunakan PDF, DOCX, XLSX, JPG, atau PNG.");
    }

    // Validate file size
    if (fileBuffer.length > MAX_ATTACHMENT_SIZE) {
      throw new Error(`Ukuran file melebihi batas ${MAX_ATTACHMENT_SIZE / 1024}KB.`);
    }

    // Compress images if needed
    let processedBuffer = fileBuffer;
    if (mimeType.startsWith("image/")) {
      processedBuffer = await compressImage(fileBuffer);
    }

    // Determine storage path
    const uploadDir = path.join(process.cwd(), "public", "uploads", "attachments", assignmentId);
    await mkdir(uploadDir, { recursive: true });

    const ext = path.extname(originalFileName);
    const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
    const filePath = path.join(uploadDir, safeFileName);
    const storageKey = `/uploads/attachments/${assignmentId}/${safeFileName}`;

    await writeFile(filePath, processedBuffer);

    // Extract text from document
    let extractedText = "";
    try {
      extractedText = await extractTextFromFile(filePath, mimeType);
    } catch (err) {
      console.warn(`[Attachment] Failed to extract text from ${originalFileName}:`, err);
    }

    // Determine order
    const maxOrder = await AssignmentAttachment.findOne({ assignmentId })
      .sort({ order: -1 })
      .select("order")
      .lean();
    const nextOrder = (maxOrder?.order ?? -1) + 1;

    const attachment = await AssignmentAttachment.create({
      assignmentId,
      storageKey,
      originalFileName,
      mimeType,
      fileSize: processedBuffer.length,
      extractedText,
      order: nextOrder,
    });

    return mapId(attachment.toObject());
  },

  /**
   * Delete an attachment (permanently)
   */
  async deleteAttachment(attachmentId: string, teacherId: string) {
    await dbConnect();

    const attachment = await AssignmentAttachment.findById(attachmentId).lean();
    if (!attachment) {
      throw new Error("Lampiran tidak ditemukan.");
    }

    // Validate ownership via assignment
    const assignment = await Assignment.findById(attachment.assignmentId).select("teacherId").lean();
    if (!assignment || assignment.teacherId.toString() !== teacherId.toString()) {
      throw new Error("Unauthorized");
    }

    // Delete file from disk
    try {
      const filePath = path.join(process.cwd(), "public", attachment.storageKey.replace(/^\//, ""));
      await unlink(filePath);
    } catch (err) {
      console.warn(`[Attachment] Failed to delete file: ${attachment.storageKey}`, err);
    }

    await AssignmentAttachment.findByIdAndDelete(attachmentId);
    return true;
  },

  /**
   * Update attachment description (e.g. for context/question number)
   */
  async updateAttachmentDescription(attachmentId: string, teacherId: string, description: string) {
    await dbConnect();
    
    const attachment = await AssignmentAttachment.findById(attachmentId).lean();
    if (!attachment) {
      throw new Error("Lampiran tidak ditemukan.");
    }

    const assignment = await Assignment.findById(attachment.assignmentId).select("teacherId").lean();
    if (!assignment || assignment.teacherId.toString() !== teacherId.toString()) {
      throw new Error("Unauthorized");
    }

    await AssignmentAttachment.findByIdAndUpdate(attachmentId, { $set: { description } });
    return true;
  },

  /**
   * Get combined extracted text from all attachments of an assignment
   */
  async getCombinedText(assignmentId: string): Promise<string> {
    await dbConnect();
    const attachments = await AssignmentAttachment.find({ assignmentId })
      .sort({ order: 1 })
      .select("extractedText originalFileName")
      .lean();

    return attachments
      .filter((a) => a.extractedText)
      .map((a) => `--- Dari file: ${a.originalFileName} ---\n${a.extractedText}`)
      .join("\n\n");
  },

  /**
   * Save AI answer key to all attachments of an assignment
   */
  async saveAnswerKey(assignmentId: string, answerKey: string) {
    await dbConnect();
    await AssignmentAttachment.updateMany(
      { assignmentId },
      { $set: { aiAnswerKey: answerKey } }
    );
  },

  /**
   * Get the AI answer key for an assignment
   */
  async getAnswerKey(assignmentId: string): Promise<string | null> {
    await dbConnect();
    const attachment = await AssignmentAttachment.findOne({
      assignmentId,
      aiAnswerKey: { $exists: true, $nin: [null, ""] },
    })
      .select("aiAnswerKey")
      .lean();
    return attachment?.aiAnswerKey || null;
  },
};

/**
 * Compress an image using sharp (resize to max 1200px width, quality 80)
 */
async function compressImage(buffer: Buffer): Promise<Buffer> {
  try {
    const sharp = (await import("sharp")).default;
    const metadata = await sharp(buffer).metadata();

    let pipeline = sharp(buffer);

    // Only resize if wider than 1200px
    if (metadata.width && metadata.width > 1200) {
      pipeline = pipeline.resize({ width: 1200, withoutEnlargement: true });
    }

    // Compress based on format
    if (metadata.format === "jpeg") {
      return await pipeline.jpeg({ quality: 75 }).toBuffer();
    } else if (metadata.format === "png") {
      return await pipeline.png({ quality: 75, compressionLevel: 9 }).toBuffer();
    }

    return await pipeline.toBuffer();
  } catch (err) {
    console.warn("[Attachment] Image compression failed, using original:", err);
    return buffer;
  }
}

/**
 * Extract text from a file based on its MIME type
 */
async function extractTextFromFile(filePath: string, mimeType: string): Promise<string> {
  if (mimeType === "application/pdf") {
    return extractTextFromPDF(filePath);
  } else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return extractTextFromDOCX(filePath);
  } else if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    return extractTextFromXLSX(filePath);
  } else if (mimeType.startsWith("image/")) {
    // For images, we'll use OCR later or return empty
    // For now, return a note that this is an image
    return "[Lampiran berupa gambar - teks akan diproses oleh AI secara visual]";
  }
  return "";
}

async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = (pdfParseModule as any).default || pdfParseModule;
    const buffer = await readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (err) {
    console.warn("[Attachment] PDF text extraction failed:", err);
    return "";
  }
}

async function extractTextFromDOCX(filePath: string): Promise<string> {
  try {
    const mammoth = await import("mammoth");
    const buffer = await readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    return result.value || "";
  } catch (err) {
    console.warn("[Attachment] DOCX text extraction failed:", err);
    return "";
  }
}

async function extractTextFromXLSX(filePath: string): Promise<string> {
  try {
    const XLSX = await import("xlsx");
    const buffer = await readFile(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });

    let allText = "";
    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const csv = XLSX.utils.sheet_to_csv(sheet);
      allText += `[Sheet: ${sheetName}]\n${csv}\n\n`;
    }
    return allText.trim();
  } catch (err) {
    console.warn("[Attachment] XLSX text extraction failed:", err);
    return "";
  }
}
