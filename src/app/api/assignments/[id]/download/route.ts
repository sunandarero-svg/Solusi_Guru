import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Assignment } from "@/models/Assignment";
import { Submission, SubmissionDocument } from "@/models/Submission";
import { StudentProfile } from "@/models/Profile";
import fs from "fs";
import path from "path";
const archiver = require("archiver");

export async function POST(
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

    // Find all documents for these submissions
    const documents = await SubmissionDocument.find({ submissionId: { $in: submissionIds } }).lean();
    
    if (documents.length === 0) {
      return NextResponse.json({ error: "Tidak ada file PDF tugas yang dikumpulkan." }, { status: 404 });
    }

    // Prepare temp directory for the ZIP
    const downloadsDir = path.join(process.cwd(), "public", "uploads", "downloads");
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }

    const zipFilename = `Tugas_${assignment.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.zip`;
    const zipFilePath = path.join(downloadsDir, zipFilename);

    // Create a file to stream archive data to
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    // Create a promise to wait for the archive to finish
    const archivePromise = new Promise<void>((resolve, reject) => {
      output.on('close', () => resolve());
      archive.on('error', (err: any) => reject(err));
    });

    archive.pipe(output);

    // Fetch students to name the files properly
    const studentIds = submissions.map(s => s.studentId);
    const students = await StudentProfile.find({ _id: { $in: studentIds } }).lean();
    const studentMap = new Map(students.map(s => [s._id.toString(), s.fullName]));

    let fileCount = 0;

    for (const doc of documents) {
      if (doc.storageKey) {
        const localFilePath = path.join(process.cwd(), "public", doc.storageKey);
        if (fs.existsSync(localFilePath)) {
          // Find which student this belongs to
          const sub = submissions.find(s => s._id.toString() === doc.submissionId.toString());
          const studentName = sub ? studentMap.get(sub.studentId.toString()) || 'Anonim' : 'Anonim';
          
          const cleanName = studentName.replace(/[^a-zA-Z0-9 ]/g, '');
          const fileExt = path.extname(localFilePath) || '.pdf';
          
          archive.file(localFilePath, { name: `${cleanName}_${fileCount}${fileExt}` });
          fileCount++;
        }
      }
    }

    if (fileCount === 0) {
      return NextResponse.json({ error: "File fisik PDF tidak ditemukan di server." }, { status: 404 });
    }

    await archive.finalize();
    await archivePromise;

    // Return the public URL for the generated ZIP
    return NextResponse.json({ 
      success: true, 
      url: `/uploads/downloads/${zipFilename}`,
      fileCount
    });

  } catch (error: any) {
    console.error("Download submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
