import dbConnect from "@/lib/mongoose";
import { Assignment, AssignmentStatus, Rubric, RubricCriterion } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import { Class } from "@/models/Class";
import { mapId } from "@/lib/mapId";
import { attachmentService } from "@/modules/attachment/attachmentService";

export const assignmentService = {
  async getAllAssignments(teacherId: string) {
    await dbConnect();
    Class.init();
    
    const assignments = await Assignment.find({ teacherId })
      .populate('classId')
      .sort({ createdAt: -1 })
      .lean();

    // Mongoose doesn't have _count in populate easily, so we aggregate or do a separate count
    // For simplicity, we map over and count submissions
    const populated = await Promise.all(assignments.map(async (assign) => {
      const subCount = await Submission.countDocuments({ assignmentId: assign._id });
      return {
        ...assign,
        class: assign.classId, // remap to match previous prisma structure
        _count: { submissions: subCount }
      };
    }));
    return mapId(populated);
  },

  async getAssignmentById(id: string) {
    await dbConnect();
    Class.init();
    
    const assignment = await Assignment.findById(id).populate('classId').lean();
    if (!assignment) return null;

    const rubrics = await Rubric.find({ assignmentId: assignment._id }).lean();
    
    const rubricsWithCriteria = await Promise.all(rubrics.map(async (r) => {
      const criteria = await RubricCriterion.find({ rubricId: r._id }).sort({ order: 1 }).lean();
      return { ...r, criteria };
    }));

    return mapId({
      ...assignment,
      class: assignment.classId,
      rubrics: rubricsWithCriteria
    });
  },

  async createAssignment(data: {
    teacherId: string;
    classId: string;
    subjectId: string;
    title: string;
    description?: string;
    instructions?: string;
    deadline?: Date;
    maxPages?: number;
  }) {
    await dbConnect();
    const assignment = await Assignment.create({
      ...data,
      status: AssignmentStatus.DRAFT,
    });
    return mapId(assignment.toObject());
  },

  async updateAssignment(id: string, teacherId: string, data: {
    title?: string;
    description?: string;
    instructions?: string;
    deadline?: Date;
    maxPages?: number;
    status?: AssignmentStatus;
  }) {
    await dbConnect();
    const assignment = await Assignment.findById(id).select('teacherId').lean();

    if (!assignment || assignment.teacherId.toString() !== teacherId.toString()) {
      throw new Error("Unauthorized or Assignment not found");
    }

    const updated = await Assignment.findByIdAndUpdate(id, data, { returnDocument: 'after' }).lean();
    return mapId(updated);
  },

  async deleteAssignment(id: string, teacherId: string) {
    await dbConnect();
    const assignment = await Assignment.findById(id).select('teacherId').lean();

    if (!assignment || assignment.teacherId.toString() !== teacherId.toString()) {
      throw new Error("Unauthorized or Assignment not found");
    }

    // Delete rubrics and criteria associated with it
    const rubrics = await Rubric.find({ assignmentId: id }).lean();
    for (const rubric of rubrics) {
      await RubricCriterion.deleteMany({ rubricId: rubric._id });
    }
    await Rubric.deleteMany({ assignmentId: id });

    // Also delete submissions to clean up
    await Submission.deleteMany({ assignmentId: id });

    await Assignment.findByIdAndDelete(id);
    return true;
  },

  async duplicateAssignment(id: string, teacherId: string, newClassId: string, newSubjectId: string) {
    await dbConnect();

    // 1. Fetch original assignment
    const originalAssignment = await Assignment.findById(id).lean();
    if (!originalAssignment || originalAssignment.teacherId.toString() !== teacherId.toString()) {
      throw new Error("Unauthorized or Assignment not found");
    }

    // 2. Create new assignment
    const newAssignment = await Assignment.create({
      teacherId: originalAssignment.teacherId,
      classId: newClassId,
      subjectId: newSubjectId,
      title: originalAssignment.title,
      description: originalAssignment.description,
      instructions: originalAssignment.instructions,
      deadline: originalAssignment.deadline,
      maxPages: originalAssignment.maxPages,
      status: AssignmentStatus.DRAFT, // Always start as draft
    });

    // 3. Duplicate rubrics and criteria
    const originalRubrics = await Rubric.find({ assignmentId: originalAssignment._id }).lean();
    for (const rubric of originalRubrics) {
      const newRubric = await Rubric.create({
        assignmentId: newAssignment._id,
        title: rubric.title,
        totalScore: rubric.totalScore,
      });

      const originalCriteria = await RubricCriterion.find({ rubricId: rubric._id }).lean();
      for (const criterion of originalCriteria) {
        await RubricCriterion.create({
          rubricId: newRubric._id,
          name: criterion.name,
          description: criterion.description,
          maxScore: criterion.maxScore,
          order: criterion.order,
        });
      }
    }

    // 4. Duplicate attachments
    await attachmentService.copyAttachments(originalAssignment._id.toString(), newAssignment._id.toString(), teacherId);

    return mapId(newAssignment.toObject());
  }
};

