import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function getAuthSession() {
  const session = await getServerSession(authOptions);
  return session;
}

export async function requireTeacherSession() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "TEACHER") {
    return null;
  }
  return session;
}

export async function requireStudentSession() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "STUDENT") {
    return null;
  }
  return session;
}

export async function requireAdminSession() {
  const session = await getAuthSession();
  if (!session || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function requireAuth() {
  const session = await getAuthSession();
  if (!session) {
    return null;
  }
  return session;
}
