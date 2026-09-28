
"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Headset, LoaderCircle, LockKeyhole } from "lucide-react";

import {
  apiRequest,
  AuthUser,
  LoginResponse,
  TOKEN_KEY,
} from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await apiRequest<LoginResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (!result.accessToken || !result.user?.role) {
        throw new Error("Invalid login response from the server.");
      }

      localStorage.setItem(TOKEN_KEY, result.accessToken);

      // Verify the issued token against the backend before continuing.
      const me = await apiRequest<AuthUser | { user: AuthUser }>("/auth/me", {
        method: "GET",
        token: result.accessToken,
      });

      const user = "user" in me ? me.user : me;

      if (!user?.id || !user?.role) {
        localStorage.removeItem(TOKEN_KEY);
        throw new Error("Could not verify your account.");
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      localStorage.removeItem(TOKEN_KEY);
      setError(
        err instanceof Error
          ? err.message
          : "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-9">
        <Link href="/" className="mx-auto flex w-fit items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Headset size={25} />
          </span>
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            ServiceDesk
          </span>
        </Link>

        <div className="mt-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Sign in to manage your internal service requests.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-slate-700"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
            />
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <LoaderCircle size={18} className="animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <LockKeyhole size={18} />
                Sign in
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          New employee?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-700 hover:text-blue-800"
          >
            Create an account
          </Link>
        </p>

        <p className="mt-5 text-center text-xs leading-5 text-slate-400">
          Authorized company users only. Access depends on your assigned role.
        </p>
      </section>
    </main>
  );
}
