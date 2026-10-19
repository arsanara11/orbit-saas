"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;

    setLoading(true);
    try {
      const result = await authClient.signOut();
      if (result.error) {
        alert(result.error.message || "Logout gagal. Coba lagi.");
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch {
      alert("Logout gagal. Periksa koneksi lalu coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="logout-button"
    >
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}
