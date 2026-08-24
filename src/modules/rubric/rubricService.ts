import dbConnect from "@/lib/mongoose";
import { Assignment, Rubric, RubricCriterion } from "@/models/Assignment";
import { mapId } from "@/lib/mapId";

export const rubricService = {
  async getRubricByAssignmentId(assignmentId: string) {
    await dbConnect();
    const rubric = await Rubric.findOne({ assignmentId }).lean();
    if (!rubric) return null;

    const criteria = await RubricCriterion.find({ rubricId: rubric._id })
      .sort({ order: 1 })
      .lean();

    return mapId({ ...rubric, criteria });
  },

  async upsertRubric(
    assignmentId: string, 
    teacherId: string, 
    data: {
      title: string;
      criteria: { id?: string; name: string; description?: string; maxScore: number; order: number }[]
    }
  ) {
    await dbConnect();
    
    // Validate assignment ownership
    const assignment = await Assignment.findById(assignmentId).select('teacherId status').lean();

    if (!assignment || assignment.teacherId.toString() !== teacherId.toString()) {
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
    let rubric = await Rubric.findOne({ assignmentId });

    if (!rubric) {
      rubric = await Rubric.create({
        assignmentId,
        title: data.title,
        totalScore: 100,
      });
    } else {
      rubric.title = data.title;
      await rubric.save();
    }

    // Delete old criteria
    await RubricCriterion.deleteMany({ rubricId: rubric._id });

    // Create new criteria
    const criteriaDocs = data.criteria.map(c => ({
      rubricId: rubric._id,
      name: c.name,
      description: c.description || "",
      maxScore: c.maxScore,
      order: c.order,
    }));
    await RubricCriterion.insertMany(criteriaDocs);

    const criteria = await RubricCriterion.find({ rubricId: rubric._id }).sort({ order: 1 }).lean();
    return mapId({ ...rubric.toObject(), criteria });
  }
};
