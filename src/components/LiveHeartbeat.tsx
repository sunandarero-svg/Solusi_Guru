"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function LiveHeartbeat() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;

    // Send heartbeat immediately on mount
    const sendHeartbeat = () => {
      fetch("/api/heartbeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }).catch(err => console.error("Heartbeat failed", err));
    };

    sendHeartbeat();

    // Set interval to ping every 60 seconds
    const interval = setInterval(sendHeartbeat, 60000);

    return () => clearInterval(interval);
  }, [session]);

  return null; // Invisible component
}
