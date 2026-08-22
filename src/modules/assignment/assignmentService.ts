import { prisma } from "@/lib/prisma";
import { AssignmentStatus } from "@prisma/client";

export const assignmentService = {
  async getAllAssignments(teacherId: string) {
    return prisma.assignment.findMany({
      where: { teacherId },
      include: {
        class: true,
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getAssignmentById(id: string) {
    return prisma.assignment.findUnique({
      where: { id },
      include: {
        class: true,
        rubrics: {
          include: { criteria: { orderBy: { order: "asc" } } }
        }
      }
    });
  },

  async createAssignment(data: {
    teacherId: string;
    classId: string;
    title: string;
    description?: string;
    instructions?: string;
    deadline?: Date;
    maxPages?: number;
  }) {
    return prisma.assignment.create({
      data: {
        ...data,
        status: AssignmentStatus.DRAFT,
      },
    });
  },

  async updateAssignment(id: string, teacherId: string, data: {
    title?: string;
    description?: string;
    instructions?: string;
    deadline?: Date;
    maxPages?: number;
    status?: AssignmentStatus;
  }) {
    // Ensure the assignment belongs to the teacher
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      select: { teacherId: true }
    });

    if (!assignment || assignment.teacherId !== teacherId) {
      throw new Error("Unauthorized or Assignment not found");
    }

    return prisma.assignment.update({
      where: { id },
      data,
    });
  },
};
