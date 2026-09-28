
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserRound,
  Mail,
  ShieldCheck,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import {
  apiRequest,
  getAuthUser,
  TOKEN_KEY,
  type AuthUser,
  type MeResponse,
} from "@/lib/api";

export default function SettingsPage() {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastVerified, setLastVerified] = useState("");

  const loadProfile = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        router.replace("/login");
        return;
      }

      const response = await apiRequest<MeResponse>("/auth/me", { token });
      const currentUser = getAuthUser(response);

      setUser(currentUser);
      setLastVerified(new Date().toLocaleString());
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load your profile.";

      setError(message);

      if (
        message.toLowerCase().includes("unauthorized") ||
        message.toLowerCase().includes("token") ||
        message.toLowerCase().includes("expired")
      ) {
        localStorage.removeItem(TOKEN_KEY);
        router.replace("/login");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    router.replace("/login");
  }

  const roleLabel = user?.role
    ? user.role.charAt(0) + user.role.slice(1).toLowerCase()
    : "Unknown";

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin" />
          Loading account settings...
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-blue-600">
            Account & Security
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Settings
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            View your account information and verify your current session.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadProfile(true)}
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh Profile
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Unable to verify your account</p>
            <p className="mt-1">{error}</p>
            <button
              type="button"
              onClick={() => void loadProfile(true)}
              className="mt-3 font-semibold underline underline-offset-4"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <UserRound className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900">Profile Information</h2>
              <p className="mt-1 text-sm text-slate-500">
                Your information from the authenticated account.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Full Name
            </p>
            <p className="mt-2 break-words font-semibold text-slate-900">
              {user?.name || "Not available"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Email Address
            </p>
            <div className="mt-2 flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
              <p className="break-all font-medium text-slate-800">
                {user?.email || "Not available"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Account Role
            </p>
            <span className="mt-2 inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">
              {roleLabel}
            </span>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              User ID
            </p>
            <p className="mt-2 break-all font-mono text-sm text-slate-600">
              {user?.id || "Not available"}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-bold text-slate-900">Session & Security</h2>
            <p className="mt-1 text-sm text-slate-500">
              The application has checked your current session with the
              backend.
            </p>

            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                <CheckCircle2 className="h-5 w-5" />
                {user ? "Account verified" : "Verification required"}
              </div>
              <p className="mt-1 text-sm text-emerald-700">
                {user
                  ? "Your account information was retrieved successfully."
                  : "Refresh your profile to verify your account."}
              </p>
              {lastVerified && (
                <p className="mt-2 text-xs text-emerald-700">
                  Last verified: {lastVerified}
                </p>
              )}
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              Your access is controlled by your assigned role. Password
              changes, email changes, and profile editing are not available
              from this page because those operations require dedicated
              backend APIs.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-slate-900">Sign Out</h2>
            <p className="mt-1 text-sm text-slate-500">
              End your current session on this browser.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </section>
    </div>
  );
}
