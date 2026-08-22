import { prisma } from "@/lib/prisma";

export const submissionService = {
  // Get active submission for a student (DRAFT or SUBMITTED)
  async getSubmissionByAssignmentAndStudent(assignmentId: string, studentId: string) {
    return prisma.submission.findFirst({
      where: {
        assignmentId,
        studentId
      },
      include: {
        pages: {
          orderBy: {
            pageNumber: 'asc'
          }
        }
      }
    });
  },

  async getSubmissionById(submissionId: string) {
    return prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        pages: {
          orderBy: { pageNumber: 'asc' }
        },
        assignment: true
      }
    });
  },

  // Create a new draft submission
  async createDraftSubmission(assignmentId: string, studentId: string) {
    // Check if one already exists
    const existing = await this.getSubmissionByAssignmentAndStudent(assignmentId, studentId);
    if (existing) {
      return existing;
    }

    return prisma.submission.create({
      data: {
        assignmentId,
        studentId,
        status: "DRAFT"
      },
      include: {
        pages: true
      }
    });
  },

  // Add an uploaded page to a submission
  async addSubmissionPage(submissionId: string, data: {
    storageKey: string;
    originalFileName: string;
    mimeType: string;
    fileSize: number;
    pageNumber: number;
  }) {
    return prisma.submissionPage.create({
      data: {
        submissionId,
        ...data
      }
    });
  },

  // Update page numbers (for reordering)
  async reorderPages(submissionId: string, pageIdsInOrder: string[]) {
    // Perform updates in a transaction
    const operations = pageIdsInOrder.map((id, index) => 
      prisma.submissionPage.update({
        where: { id },
        data: { pageNumber: index + 1 }
      })
    );

    return prisma.$transaction(operations);
  },

  // Remove a page
  async removePage(pageId: string) {
    return prisma.submissionPage.delete({
      where: { id: pageId }
    });
  },

  // Submit the assignment
  async submitAssignment(submissionId: string, status: any = "SUBMITTED") {
    return prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: status,
        submittedAt: new Date()
      }
    });
  },

  // Update submission status
  async updateStatus(submissionId: string, status: any) {
    return prisma.submission.update({
      where: { id: submissionId },
      data: { status }
    });
  }
};
