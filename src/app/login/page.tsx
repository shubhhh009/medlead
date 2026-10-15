"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@medlead.demo");
  const [password, setPassword] = useState("AdminDemo@123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Login failed. Please try again.");
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid-cols-2">
        <section className="hidden flex-col justify-between bg-slate-950 p-10 text-white md:flex">
          <div>
            <p className="text-3xl font-bold">
              MedLead<span className="text-blue-400">.</span>
            </p>
            <p className="mt-2 text-sm text-slate-400">
              PATIENT MANAGEMENT SYSTEM
            </p>
          </div>

          <div>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500/20 text-3xl text-blue-300">
              +
            </div>
            <h1 className="text-3xl font-bold leading-snug">
              Better care starts with better connections.
            </h1>
            <p className="mt-4 leading-7 text-slate-400">
              Manage patient inquiries, coordinate follow-ups, and track every
              lead through your care pipeline.
            </p>
          </div>

          <p className="text-xs text-slate-500">
            MedLead · Patient inquiry management
          </p>
        </section>

        <section className="p-7 sm:p-10 lg:p-12">
          <div className="mb-8 md:hidden">
            <p className="text-2xl font-bold text-slate-900">
              MedLead<span className="text-blue-600">.</span>
            </p>
          </div>

          <p className="text-sm font-semibold uppercase tracking-widest text-blue-600">
            Welcome back
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">
            Sign in to MedLead
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            Enter your account details to access your workspace.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-4 py-3.5 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in to workspace"}
            </button>
          </form>

          <div className="mt-7 rounded-xl bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">
              Demo account
            </p>
            <p className="mt-2 text-xs text-slate-500">
              Admin credentials are prefilled for local testing. You can edit
              them to test another account.
            </p>
          </div>

          <p className="mt-7 text-center text-xs text-slate-400">
            Secure access · Authorized team members only
          </p>
        </section>
      </div>
    </main>
  );
}