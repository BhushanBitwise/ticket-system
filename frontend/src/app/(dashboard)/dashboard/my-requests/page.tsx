
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  ClipboardList,
  LoaderCircle,
  RefreshCw,
  Ticket,
} from "lucide-react";

import { apiRequest, TOKEN_KEY } from "@/lib/api";

type TicketStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "RESOLVED"
  | "CLOSED";

type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type TicketCategory =
  | string
  | {
      name?: string;
      _id?: string;
    }
  | null;

type ServiceRequest = {
  _id?: string;
  id?: string;
  requestId?: string;
  title: string;
  description?: string;
  category?: TicketCategory;
  categoryId?: TicketCategory;
  priority?: TicketPriority;
  status: TicketStatus;
  createdAt?: string;
  updatedAt?: string;
};

type RequestsResponse =
  | ServiceRequest[]
  | {
      requests?: ServiceRequest[];
      data?: ServiceRequest[];
    };

const statusStyles: Record<string, string> = {
  OPEN: "bg-blue-50 text-blue-700 ring-blue-200",
  ASSIGNED: "bg-violet-50 text-violet-700 ring-violet-200",
  IN_PROGRESS: "bg-amber-50 text-amber-700 ring-amber-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  CLOSED: "bg-slate-100 text-slate-700 ring-slate-200",
};

const priorityStyles: Record<string, string> = {
  LOW: "text-slate-600",
  MEDIUM: "text-blue-700",
  HIGH: "text-orange-700",
  URGENT: "text-red-700",
};

function getCategoryName(category?: TicketCategory) {
  if (!category) return "—";
  if (typeof category === "string") return category;
  return category.name ?? "—";
}

function getMongoId(request: ServiceRequest) {
  return request._id ?? request.id ?? "";
}

function formatDate(date?: string) {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatLabel(value?: string) {
  if (!value) return "—";

  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function MyRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        throw new Error(
          "Your session has expired. Please log in again.",
        );
      }

      const response = await apiRequest<RequestsResponse>(
        "/requests/my",
        {
          method: "GET",
          token,
        },
      );

      const items = Array.isArray(response)
        ? response
        : response.requests ?? response.data ?? [];

      setRequests(items);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your requests.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const openCount = requests.filter(
    (request) =>
      request.status === "OPEN" ||
      request.status === "ASSIGNED" ||
      request.status === "IN_PROGRESS",
  ).length;

  const resolvedCount = requests.filter(
    (request) =>
      request.status === "RESOLVED" ||
      request.status === "CLOSED",
  ).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-600">
            EMPLOYEE PORTAL
          </p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            My Requests
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Track the service requests you have submitted.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void loadRequests()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>

          <Link
            href="/dashboard/create-request"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <Ticket className="h-4 w-4" />
            Create Request
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Total Requests</p>
            <ClipboardList className="h-5 w-5 text-blue-600" />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {loading ? "—" : requests.length}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Active Requests</p>
            <Ticket className="h-5 w-5 text-amber-600" />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {loading ? "—" : openCount}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">Resolved / Closed</p>
            <ClipboardList className="h-5 w-5 text-emerald-600" />
          </div>

          <p className="mt-3 text-3xl font-bold text-slate-900">
            {loading ? "—" : resolvedCount}
          </p>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <div className="flex-1">
            <p className="font-semibold">Could not load requests</p>
            <p className="mt-1">{error}</p>

            <button
              type="button"
              onClick={() => void loadRequests()}
              className="mt-3 font-semibold underline underline-offset-2"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Request history */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="font-semibold text-slate-900">
            Request History
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            View your requests and manage resolved issues.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-slate-500">
            <LoaderCircle className="h-5 w-5 animate-spin" />
            Loading your requests...
          </div>
        ) : !error && requests.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <ClipboardList className="mx-auto h-10 w-10 text-slate-300" />

            <h3 className="mt-4 font-semibold text-slate-900">
              No requests yet
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              When you submit a service request, it will appear here.
            </p>

            <Link
              href="/dashboard/create-request"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Create your first request
            </Link>
          </div>
        ) : !error ? (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Request</th>
                    <th className="px-5 py-3 font-semibold">Category</th>
                    <th className="px-5 py-3 font-semibold">Priority</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">Created</th>
                    <th className="px-5 py-3 font-semibold">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {requests.map((request, index) => {
                    const mongoId = getMongoId(request);

                    return (
                      <tr
                        key={
                          mongoId ||
                          request.requestId ||
                          `${request.title}-${index}`
                        }
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">
                            {request.title}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {request.requestId ??
                              mongoId ??
                              request.id ??
                              "ID unavailable"}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {getCategoryName(
                            request.category ?? request.categoryId,
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`font-semibold ${
                              priorityStyles[request.priority ?? ""] ??
                              "text-slate-600"
                            }`}
                          >
                            {formatLabel(request.priority)}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                              statusStyles[request.status] ??
                              "bg-slate-100 text-slate-700 ring-slate-200"
                            }`}
                          >
                            {formatLabel(request.status)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatDate(request.createdAt)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          {mongoId ? (
                            <Link
                              href={`/dashboard/my-requests/${encodeURIComponent(mongoId)}`}
                              className="inline-flex items-center gap-1.5 font-semibold text-blue-700 hover:text-blue-900"
                            >
                              View Details
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-400">
                              Details unavailable
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {requests.map((request, index) => {
                const mongoId = getMongoId(request);

                return (
                  <article
                    key={
                      mongoId ||
                      request.requestId ||
                      `${request.title}-${index}`
                    }
                    className="space-y-3 p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words font-semibold text-slate-900">
                          {request.title}
                        </h3>

                        <p className="mt-1 break-all text-xs text-slate-500">
                          {request.requestId ??
                            mongoId ??
                            request.id ??
                            "ID unavailable"}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
                          statusStyles[request.status] ??
                          "bg-slate-100 text-slate-700 ring-slate-200"
                        }`}
                      >
                        {formatLabel(request.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-slate-500">Category</p>
                        <p className="mt-1 text-slate-700">
                          {getCategoryName(
                            request.category ?? request.categoryId,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Priority</p>
                        <p
                          className={`mt-1 font-semibold ${
                            priorityStyles[request.priority ?? ""] ??
                            "text-slate-600"
                          }`}
                        >
                          {formatLabel(request.priority)}
                        </p>
                      </div>

                      <div className="col-span-2">
                        <p className="text-xs text-slate-500">Created</p>
                        <p className="mt-1 text-slate-700">
                          {formatDate(request.createdAt)}
                        </p>
                      </div>
                    </div>

                    {mongoId && (
                      <Link
                        href={`/dashboard/my-requests/${encodeURIComponent(mongoId)}`}
                        className="inline-flex items-center gap-1.5 pt-1 text-sm font-semibold text-blue-700 hover:text-blue-900"
                      >
                        View Details
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </article>
                );
              })}
            </div>

            <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
              Showing {requests.length} request
              {requests.length === 1 ? "" : "s"}.
            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
