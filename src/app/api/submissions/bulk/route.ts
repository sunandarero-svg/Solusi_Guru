import { NextRequest, NextResponse } from "next/server";
import { requireTeacherSession } from "@/modules/auth/session";
import dbConnect from "@/lib/mongoose";
import { Submission, TeacherReview, AIAssessment } from "@/models/Submission";
import User from "@/models/User";
import { TeacherProfile } from "@/models/Profile";

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireTeacherSession();
    if (!session || !session.user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { submissionIds, action } = body;

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json({ error: "Pilih setidaknya satu tugas" }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email }).lean();
    if (!user) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    
    const teacherProfile = await TeacherProfile.findOne({ userId: user._id }).lean();
    if (!teacherProfile) return NextResponse.json({ error: "Teacher profile not found" }, { status: 404 });

    const statusMap = {
      approve: "APPROVED",
      publish: "PUBLISHED"
    };

    const targetStatus = statusMap[action as keyof typeof statusMap];
    if (!targetStatus) {
      return NextResponse.json({ error: "Aksi tidak valid" }, { status: 400 });
    }

    // Update submissions
    await Submission.updateMany(
      { _id: { $in: submissionIds } },
      { $set: { status: targetStatus } }
    );
    
    // Process TeacherReview creation/update
    const submissions = await Submission.find({ _id: { $in: submissionIds } }).lean();
    
    for (const sub of submissions) {
      const aiAssessment = await AIAssessment.findOne({ submissionId: sub._id }).lean();
      
      const updateData: any = { 
        status: targetStatus,
        teacherId: teacherProfile._id 
      };
      
      if (targetStatus === "PUBLISHED") {
        updateData.reviewedAt = new Date();
      }

      await TeacherReview.findOneAndUpdate(
        { submissionId: sub._id },
        {
          $set: updateData,
          $setOnInsert: {
            finalScore: aiAssessment?.suggestedScore || 0,
            finalFeedback: "Tugas telah dievaluasi."
          }
        },
        { upsert: true, returnDocument: 'after' }
      );
    }
    
    const message = action === "approve" ? "Tugas berhasil disetujui secara massal." : "Tugas berhasil dipublish secara massal.";
    return NextResponse.json({ success: true, message });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

