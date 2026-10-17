"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type AuthGuardProps = {
  children: React.ReactNode;
};

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/me", {
          credentials: "same-origin",
          cache: "no-store",
        });

        if (cancelled) return;

        if (!response.ok) {
          router.replace("/login");
          return;
        }

        const data = await response.json();

        if (!cancelled && data.authenticated === true) {
          setAuthorized(true);
        } else if (!cancelled) {
          router.replace("/login");
        }
      } catch {
        if (!cancelled) {
          router.replace("/login");
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-gray-500">
          Memeriksa sesi login...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
