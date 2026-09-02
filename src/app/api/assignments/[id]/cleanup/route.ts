import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Assignment } from "@/models/Assignment";
import { Submission, SubmissionDocument, SubmissionPage } from "@/models/Submission";
import fs from "fs/promises";
import path from "path";

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await props.params;
    await dbConnect();

    const assignment = await Assignment.findById(resolvedParams.id).lean();
    if (!assignment) return NextResponse.json({ error: "Assignment not found" }, { status: 404 });

    // Find all submissions for this assignment
    const submissions = await Submission.find({ assignmentId: assignment._id }).lean();
    const submissionIds = submissions.map(s => s._id);

    if (submissionIds.length === 0) {
      return NextResponse.json({ message: "Tidak ada data untuk dibersihkan." });
    }

    // Find all documents and pages
    const documents = await SubmissionDocument.find({ submissionId: { $in: submissionIds } }).lean();
    const pages = await SubmissionPage.find({ submissionId: { $in: submissionIds } }).lean();

    let deletedFiles = 0;

    // Helper to delete file if exists
    const safeDeleteFile = async (storageKey: string) => {
      try {
        const localPath = path.join(process.cwd(), "public", storageKey);
        await fs.unlink(localPath);
        deletedFiles++;
      } catch (err: any) {
        // Ignore if file doesn't exist
        if (err.code !== 'ENOENT') {
          console.error(`Failed to delete ${storageKey}:`, err);
        }
      }
    };

    // Delete physical documents (PDFs)
    for (const doc of documents) {
      if (doc.storageKey && !doc.storageKey.startsWith("http")) {
        await safeDeleteFile(doc.storageKey);
      }
    }

    // Delete physical pages (Images/PDFs)
    for (const page of pages) {
      if (page.storageKey && !page.storageKey.startsWith("http")) {
        await safeDeleteFile(page.storageKey);
      }
    }

    // Delete records from database
    await SubmissionDocument.deleteMany({ submissionId: { $in: submissionIds } });
    await SubmissionPage.deleteMany({ submissionId: { $in: submissionIds } });

    // Optionally reset submission status? No, keep the AI results and grades!
    // The user just wants to delete the PDF files to save space. The grades/reviews should remain.

    return NextResponse.json({ 
      success: true, 
      message: `Berhasil menghapus ${deletedFiles} file fisik dari server.`,
      deletedFiles
    });

  } catch (error: any) {
    console.error("Cleanup submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
