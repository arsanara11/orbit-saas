"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message || "Registrasi gagal.");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7ff] p-6">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md space-y-5 rounded-3xl bg-white p-8 shadow-xl"
      >
        <div>
          <p className="text-2xl font-bold text-violet-600">Orbit</p>
          <h1 className="mt-5 text-3xl font-bold text-gray-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Start organizing your work with Orbit.
          </p>
        </div>

        <label className="block text-sm font-medium text-gray-700">
          Full name
          <input
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-violet-500"
            placeholder="Your name"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Email
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-violet-500"
            placeholder="you@example.com"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          Password
          <input
            required
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-xl border border-gray-200 p-3 outline-none focus:border-violet-500"
            placeholder="At least 8 characters"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-violet-600 p-3 font-semibold text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-violet-600"
          >
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
