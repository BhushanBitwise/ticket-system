
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  RefreshCw,
  Ticket,
  Users,
  LoaderCircle,
  CircleDot,
} from "lucide-react";
import {
  apiRequest,
  AuthUser,
  getAuthUser,
  MeResponse,
  TOKEN_KEY,
} from "@/lib/api";

type Summary = Record<string, number>;

type DashboardRequest = {
  _id: string;
  requestId: string;
  title: string;
  status: string;
  priority: string;
  createdAt: string;
  category?: { name: string } | null;
  createdBy?: { name: string } | null;
  assignedTo?: { name: string } | null;
};

type DashboardResponse = {
  summary: Summary;
  recentRequests: DashboardRequest[];
};

function formatDate(value: string) {
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/Requests/g, "")
    .replace(/([A-Z])/g, " $1")
    .trim();
}

function statusClass(status: string) {
  const styles: Record<string, string> = {
    OPEN: "bg-blue-50 text-blue-700",
    ASSIGNED: "bg-purple-50 text-purple-700",
    IN_PROGRESS: "bg-amber-50 text-amber-700",
    RESOLVED: "bg-green-50 text-green-700",
    CLOSED: "bg-gray-100 text-gray-700",
  };

  return styles[status] ?? "bg-gray-100 text-gray-700";
}

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      setError("Login session not found. Please log in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      // First identify the logged-in user.
      const meResponse = await apiRequest<MeResponse>("/auth/me", {
        method: "GET",
        token,
      });

      const currentUser = getAuthUser(meResponse);
      setUser(currentUser);

      // Call the dashboard endpoint matching the user's role.
      const endpointByRole: Record<AuthUser["role"], string> = {
        ADMIN: "/dashboard/admin",
        EMPLOYEE: "/dashboard/employee",
        AGENT: "/dashboard/agent",
      };

      const result = await apiRequest<DashboardResponse>(
        endpointByRole[currentUser.role],
        {
          method: "GET",
          token,
        },
      );

      setData(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const summary = data?.summary ?? {};
  const requests = data?.recentRequests ?? [];

  const statsConfig: Record<
    AuthUser["role"],
    { key: string; label: string; icon: "ticket" | "clock" | "check" | "users" }[]
  > = {
    ADMIN: [
      { key: "totalRequests", label: "Total Requests", icon: "ticket" },
      { key: "openRequests", label: "Open Requests", icon: "clock" },
      { key: "assignedRequests", label: "Assigned", icon: "ticket" },
      { key: "inProgressRequests", label: "In Progress", icon: "clock" },
      { key: "resolvedRequests", label: "Resolved", icon: "check" },
      { key: "closedRequests", label: "Closed", icon: "check" },
      { key: "totalEmployees", label: "Employees", icon: "users" },
      { key: "totalAgents", label: "Agents", icon: "users" },
      { key: "activeCategories", label: "Active Categories", icon: "ticket" },
    ],
    EMPLOYEE: [
      { key: "totalRequests", label: "My Requests", icon: "ticket" },
      { key: "openRequests", label: "Open Requests", icon: "clock" },
      { key: "assignedRequests", label: "Assigned", icon: "ticket" },
      { key: "inProgressRequests", label: "In Progress", icon: "clock" },
      { key: "resolvedRequests", label: "Resolved", icon: "check" },
      { key: "closedRequests", label: "Closed", icon: "check" },
    ],
    AGENT: [
      { key: "totalAssignedRequests", label: "My Tickets", icon: "ticket" },
      { key: "assignedRequests", label: "Awaiting Start", icon: "clock" },
      { key: "inProgressRequests", label: "In Progress", icon: "clock" },
      { key: "resolvedRequests", label: "Resolved", icon: "check" },
      { key: "closedRequests", label: "Closed", icon: "check" },
    ],
  };

  const iconFor = (name: "ticket" | "clock" | "check" | "users") => {
    if (name === "clock") return Clock;
    if (name === "check") return CheckCircle2;
    if (name === "users") return Users;
    return Ticket;
  };

  const role = user?.role;
  const stats = role ? statsConfig[role] : [];

  const quickLink =
    role === "ADMIN"
      ? { href: "/dashboard/requests", label: "View All Requests" }
      : role === "AGENT"
        ? { href: "/dashboard/assigned-requests", label: "View Assigned Requests" }
        : { href: "/dashboard/my-requests", label: "View My Requests" };

  return (
    <div className="space-y-6 pb-8">
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            {role ? `${role.charAt(0) + role.slice(1).toLowerCase()} Workspace` : "Workspace"}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {user ? `Welcome, ${user.name}. Here is your latest overview.` : "Overview of your service requests."}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {user?.role === "EMPLOYEE" && (
            <Link
              href="/dashboard/create-request"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              <CircleDot size={16} />
              Create Request
            </Link>
          )}

          <button
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={20} className="mt-0.5 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold">Dashboard could not be loaded</p>
            <p className="mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadDashboard()}
            className="shrink-0 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      <section>
        <div className="mb-4">
          <h2 className="font-bold text-gray-900">Overview</h2>
          <p className="mt-1 text-sm text-gray-500">
            Live information from your account.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => {
            const Icon = iconFor(stat.icon);

            return (
              <div
                key={stat.key}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-500">
                    {stat.label}
                  </p>
                  <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
                    <Icon size={20} />
                  </div>
                </div>
                <p className="mt-4 text-3xl font-bold text-gray-900">
                  {loading && !data ? (
                    <span className="inline-block h-9 w-12 animate-pulse rounded bg-gray-100" />
                  ) : (
                    summary[stat.key] ?? 0
                  )}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b border-gray-200 px-5 py-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold text-gray-900">Recent Requests</h2>
            <p className="mt-1 text-sm text-gray-500">
              Latest tickets available for your role.
            </p>
          </div>
          <Link
            href={quickLink.href}
            className="inline-flex items-center gap-1 self-start text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            {quickLink.label}
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading && !data ? (
          <div className="flex items-center justify-center gap-3 px-5 py-16 text-sm text-gray-500">
            <LoaderCircle size={20} className="animate-spin" />
            Loading dashboard...
          </div>
        ) : error && !data ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            Dashboard data is unavailable. Use Retry to reload.
          </div>
        ) : requests.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-gray-500">
            No requests found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">Request</th>
                  {role !== "EMPLOYEE" && (
                    <th className="px-5 py-4 font-semibold">Employee</th>
                  )}
                  <th className="px-5 py-4 font-semibold">Category</th>
                  <th className="px-5 py-4 font-semibold">Priority</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="max-w-xs px-5 py-4">
                      <p className="font-semibold text-gray-900">{item.title}</p>
                      <p className="mt-1 text-xs text-gray-500">{item.requestId}</p>
                    </td>
                    {role !== "EMPLOYEE" && (
                      <td className="px-5 py-4 text-gray-600">
                        {item.createdBy?.name ?? "—"}
                      </td>
                    )}
                    <td className="px-5 py-4 text-gray-600">
                      {item.category?.name ?? "Uncategorized"}
                    </td>
                    <td className="px-5 py-4 font-semibold text-gray-700">
                      {item.priority}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                        {item.status.replaceAll("_", " ")}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
