"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { acceptInvitationAction } from "@/app/actions";

export default function AcceptInvitePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErrorMsg("Invalid invitation link.");
      setLoading(false);
      return;
    }

    acceptInvitationAction(token)
      .then(() => {
        router.push("/overview");
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to accept invitation";
        setErrorMsg(msg);
        setLoading(false);
      });
  }, [token, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#242628] text-white p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6 shadow-2xl text-center space-y-4">
        <h2 className="text-lg font-bold">Workspace Invitation</h2>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 py-4">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            Joining Workspace...
          </div>
        )}

        {errorMsg && (
          <div className="space-y-4">
            <p className="text-xs text-red-400 bg-red-500/10 p-3 rounded-xl border border-red-500/20">
              {errorMsg}
            </p>
            <button
              onClick={() => router.push("/overview")}
              className="w-full py-2 rounded-xl bg-[#35383a] text-xs font-semibold text-white hover:bg-[#424548] transition cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </main>
  );
}