"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const checked = useRef(false);

  useEffect(() => {
    if (status === "authenticated" && !checked.current) {
      checked.current = true;
      const sessionActive = sessionStorage.getItem("app_session");
      
      // If no session marker exists and we are not on the login page, it means
      // the user opened the app in a new window/tab but an old persistent cookie exists.
      // We must force them to login again.
      if (!sessionActive && pathname !== "/login") {
        signOut({ callbackUrl: "/login" });
      }
    }
  }, [status, pathname]);

  return <>{children}</>;
}
