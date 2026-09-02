"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // Wait until NextAuth finishes loading the session state
    if (status === "loading") return;

    if (status === "authenticated") {
      const sessionActive = sessionStorage.getItem("app_session");
      
      // If no session marker exists and we are not on the login page, it means
      // the user opened the app in a new window/tab but an old persistent cookie exists.
      // We must force them to login again without flashing the protected content.
      if (!sessionActive && pathname !== "/login") {
        signOut({ callbackUrl: "/login" });
        return; // Early return to keep isValidating true
      }
    }
    
    // Once validated (or if unauthenticated and handled elsewhere), allow render
    setIsValidating(false);
  }, [status, pathname]);

  // Show a loading state to prevent flash of content while validating,
  // except on the login page itself to ensure fast loading there.
  if (isValidating && pathname !== "/login") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return <>{children}</>;
}

