import dbConnect from "@/lib/mongoose";
import { Assignment, AssignmentStatus, Rubric, RubricCriterion } from "@/models/Assignment";
import { Submission } from "@/models/Submission";
import { Class } from "@/models/Class";
import { mapId } from "@/lib/mapId";

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

    const updated = await Assignment.findByIdAndUpdate(id, data, { new: true }).lean();
    return mapId(updated);
  },
};
