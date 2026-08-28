import { NextRequest, NextResponse } from "next/server";
import { requireStudentSession, requireTeacherSession } from "@/modules/auth/session";
import { submissionService } from "@/modules/submission/submissionService";
import { pdfService } from "@/modules/pdf/pdfService";
import { ocrService } from "@/modules/ocr/ocrService";
import { aiService } from "@/modules/ai/aiService";
import { processingWorker } from "@/modules/queue/processingWorker";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStudentSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await props.params;
    const submission = await submissionService.getSubmissionById(resolvedParams.id);
    if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(submission);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireStudentSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await props.params;
    const body = await req.json();
    
    if (body.action === "SUBMIT") {
      // 1. Mark as SUBMITTED first so user knows it went through
      await submissionService.submitAssignment(resolvedParams.id, "SUBMITTED");
      
      // 2. Generate PDF immediately so the student can review their document
      await pdfService.generatePDFFromSubmission(resolvedParams.id);
      
      // We no longer trigger AI automatically here so the student can review their PDF first.
      return NextResponse.json({ status: "SUBMITTED", message: "Submission is uploaded and ready for student review." });
    } else if (body.action === "PROCESS_AI") {
      // 1. Change status to PROCESSING
      await submissionService.updateStatus(resolvedParams.id, "PROCESSING");
      
      // 2. Trigger asynchronous background processing (fire-and-forget)
      processingWorker.processSubmissionPipeline(resolvedParams.id);

      return NextResponse.json({ status: "PROCESSING_QUEUED", message: "Submission is being processed by AI." });
    } else if (body.action === "REORDER_PAGES") {
      const { pageIdsInOrder } = body;
      if (!Array.isArray(pageIdsInOrder)) {
        return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
      }
      await submissionService.reorderPages(resolvedParams.id, pageIdsInOrder);
      return NextResponse.json({ success: true });
    } else if (body.action === "DELETE_PAGE") {
      const { pageId } = body;
      await submissionService.removePage(pageId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Submission PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireTeacherSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const resolvedParams = await props.params;
    
    await submissionService.deleteSubmission(resolvedParams.id);

    return NextResponse.json({ success: true, message: "Submission deleted" });
  } catch (error) {
    console.error("Submission DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
