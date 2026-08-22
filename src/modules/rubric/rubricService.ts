import { prisma } from "@/lib/prisma";

export const rubricService = {
  async getRubricByAssignmentId(assignmentId: string) {
    return prisma.rubric.findFirst({
      where: { assignmentId },
      include: {
        criteria: {
          orderBy: { order: "asc" }
        }
      }
    });
  },

  async upsertRubric(
    assignmentId: string, 
    teacherId: string, 
    data: {
      title: string;
      criteria: { id?: string; name: string; description?: string; maxScore: number; order: number }[]
    }
  ) {
    // Validate assignment ownership
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { teacherId: true, status: true }
    });

    if (!assignment || assignment.teacherId !== teacherId) {
      throw new Error("Unauthorized or Assignment not found");
    }
    
    // Suggestion from Plan: Prevent modifying rubric if assignment is PUBLISHED or CLOSED
    if (assignment.status !== "DRAFT") {
      throw new Error("Cannot modify rubric for an assignment that is already published.");
    }

    // Validate total score is exactly 100
    const totalScore = data.criteria.reduce((sum, c) => sum + c.maxScore, 0);
    if (Math.abs(totalScore - 100) > 0.01) {
      throw new Error(`Total score must be exactly 100. Current total is ${totalScore}`);
    }

    // Upsert Rubric & replace all criteria
    // Since Prisma nested create/update can be tricky with lists, we can delete existing and recreate
    
    return prisma.$transaction(async (tx) => {
      let rubric = await tx.rubric.findFirst({
        where: { assignmentId }
      });

      if (!rubric) {
        rubric = await tx.rubric.create({
          data: {
            assignmentId,
            title: data.title,
            totalScore: 100,
          }
        });
      } else {
        rubric = await tx.rubric.update({
          where: { id: rubric.id },
          data: { title: data.title }
        });
      }

      // Delete old criteria
      await tx.rubricCriterion.deleteMany({
        where: { rubricId: rubric.id }
      });

      // Create new criteria
      await tx.rubricCriterion.createMany({
        data: data.criteria.map((c) => ({
          rubricId: rubric!.id,
          name: c.name,
          description: c.description || "",
          maxScore: c.maxScore,
          order: c.order,
        }))
      });

      return tx.rubric.findUnique({
        where: { id: rubric.id },
        include: { criteria: { orderBy: { order: "asc" } } }
      });
    });
  }
};
