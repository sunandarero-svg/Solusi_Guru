import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import { Class, TeacherClass } from "@/models/Class";
import { TeacherProfile } from "@/models/Profile";
import { mapId } from "@/lib/mapId";

export async function getAllClasses() {
  await dbConnect();
  const classes = await Class.find()
    .sort({ name: 1 })
    .lean();
  return mapId(classes);
}

export async function getTeacherProfileByEmail(email: string) {
  await dbConnect();
  
  const user = await User.findOne({ email }).lean();
  if (!user) return null;

  const profile = await TeacherProfile.findOne({ userId: user._id }).lean();
  return mapId(profile);
}
