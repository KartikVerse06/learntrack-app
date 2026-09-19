"use client";

import { useEffect } from "react";
import { getClientAuthToken } from "@/lib/api/client";

/**
 * AuthGuard enforces that protected pages cannot be inspected from the
 * browser's back-forward cache (bfcache) after a user signs out.
 */
export function AuthGuard() {
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      // If the page was restored from bfcache, check if token is still valid
      if (event.persisted || !getClientAuthToken()) {
        const token = getClientAuthToken();
        if (!token) {
          window.location.replace("/login");
        }
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => {
      window.removeEventListener("pageshow", handlePageShow);
    };
  }, []);

  return null;
}
