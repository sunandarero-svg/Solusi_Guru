import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardLayoutClient from "@/components/DashboardLayoutClient";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  const userEmail = session.user.email || "";

  return (
    <DashboardLayoutClient userEmail={userEmail} role={role}>
      {children}
    </DashboardLayoutClient>
  );
}
