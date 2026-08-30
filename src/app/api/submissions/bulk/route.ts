import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Submission, TeacherReview } from "@/models/Submission";

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { submissionIds, action } = body;

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json({ error: "Pilih setidaknya satu tugas" }, { status: 400 });
    }

    await dbConnect();

    if (action === "approve") {
      // Update submissions to APPROVED
      await Submission.updateMany(
        { _id: { $in: submissionIds } },
        { $set: { status: "APPROVED" } }
      );
      
      // Update or create TeacherReviews
      const submissions = await Submission.find({ _id: { $in: submissionIds } }).lean();
      
      for (const sub of submissions) {
        await TeacherReview.findOneAndUpdate(
          { submissionId: sub._id },
          { 
            status: "APPROVED",
            // We don't overwrite finalScore if it exists, or we could set it to AI score
          },
          { upsert: true }
        );
      }
      
      return NextResponse.json({ success: true, message: "Tugas berhasil disetujui secara massal." });
    }
    
    if (action === "publish") {
      await Submission.updateMany(
        { _id: { $in: submissionIds } },
        { $set: { status: "PUBLISHED" } }
      );
      return NextResponse.json({ success: true, message: "Tugas berhasil dipublish secara massal." });
    }

    return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
