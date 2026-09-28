
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Loader2,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  ClipboardList,
} from "lucide-react";
import {
  apiRequest,
  getAuthUser,
  TOKEN_KEY,
  type AuthUser,
  type MeResponse,
} from "@/lib/api";

type RequestDetails = {
  _id?: string;
  id?: string;
  requestId: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  category?: { name?: string; description?: string } | string | null;
  createdBy?: { name?: string; email?: string } | string | null;
  assignedTo?: { name?: string; email?: string } | string | null;
  attachmentUrl?: string | null;
  resolutionNote?: string | null;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
};

type RequestResponse = RequestDetails | { request: RequestDetails };

function normalizeRequest(response: RequestResponse): RequestDetails {
  return "request" in response ? response.request : response;
}

function displayPerson(person?: RequestDetails["createdBy"]) {
  if (!person) return "Not assigned";
  if (typeof person === "string") return "—";
  return person.name || person.email || "—";
}

function displayCategory(category?: RequestDetails["category"]) {
  if (!category) return "—";
  if (typeof category === "string") return category;
  return category.name || "—";
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    OPEN: "bg-blue-50 text-blue-700",
    ASSIGNED: "bg-violet-50 text-violet-700",
    IN_PROGRESS: "bg-amber-50 text-amber-700",
    RESOLVED: "bg-green-50 text-green-700",
    CLOSED: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${
        styles[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="break-words text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

export default function RequestDetailsPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadDetails = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error("Session expired. Please login again.");

      const [requestResponse, userResponse] = await Promise.all([
        apiRequest<RequestResponse>(`/requests/${id}`, {
          method: "GET",
          token,
        }),
        apiRequest<MeResponse>("/auth/me", {
          method: "GET",
          token,
        }),
      ]);

      setRequest(normalizeRequest(requestResponse));
      setUser(getAuthUser(userResponse));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load request details.",
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  async function updateEmployeeRequest(action: "close" | "reopen") {
    if (!request) return;

    setError("");
    setSuccess("");

    if (user?.role !== "EMPLOYEE") {
      setError("Only the employee who created this request can close or reopen it.");
      return;
    }

    if (action === "close" && request.status !== "RESOLVED") {
      setError("Only resolved requests can be closed.");
      return;
    }

    if (action === "reopen" && request.status !== "RESOLVED") {
      setError("Only resolved requests can be reopened.");
      return;
    }

    setActionLoading(true);

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error("Session expired. Please login again.");

      await apiRequest(`/requests/${id}/${action}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({}),
      });

      setSuccess(
        action === "close"
          ? "Request closed successfully."
          : "Request reopened. The assigned agent can continue working on it.",
      );

      await loadDetails();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : `Unable to ${action} this request.`,
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center gap-3 text-sm text-gray-500">
        <Loader2 size={21} className="animate-spin" />
        Loading request details...
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-4 sm:p-6">
        <Link
          href={user?.role === "AGENT" ? "/dashboard/assigned-requests" : "/dashboard/my-requests"}
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft size={16} /> Back to requests
        </Link>
        <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
        <button
          type="button"
          onClick={() => void loadDetails()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!request) return null;

  const isEmployee = user?.role === "EMPLOYEE";
  const isAgent = user?.role === "AGENT";
  const backHref = isAgent
    ? "/dashboard/assigned-requests"
    : isEmployee
      ? "/dashboard/my-requests"
      : "/dashboard/requests";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft size={16} />
        Back to requests
      </Link>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="shrink-0" />
          <p className="break-words">{error}</p>
          <button type="button" className="ml-auto" onClick={() => setError("")}>✕</button>
        </div>
      )}

      {success && (
        <div role="status" className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 size={19} className="shrink-0" />
          <p>{success}</p>
          <button type="button" className="ml-auto" onClick={() => setSuccess("")}>✕</button>
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0">
            <p className="font-mono text-sm font-semibold text-blue-700">
              {request.requestId}
            </p>
            <h1 className="mt-2 break-words text-2xl font-bold text-gray-900">
              {request.title}
            </h1>
            <p className="mt-2 text-sm text-gray-500">
              Created{" "}
              {request.createdAt
                ? new Date(request.createdAt).toLocaleString()
                : "—"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={request.status} />
            {request.priority && (
              <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700">
                {request.priority}
              </span>
            )}
          </div>
        </div>

        <div className="mt-7 border-t border-gray-100 pt-6">
          <h2 className="mb-2 font-semibold text-gray-900">Description</h2>
          <p className="whitespace-pre-wrap break-words text-sm leading-7 text-gray-600">
            {request.description || "No description provided."}
          </p>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-5 border-t border-gray-100 pt-6 sm:grid-cols-2 lg:grid-cols-3">
          <DetailRow label="Category" value={displayCategory(request.category)} />
          <DetailRow label="Created By" value={displayPerson(request.createdBy)} />
          <DetailRow label="Assigned Agent" value={displayPerson(request.assignedTo)} />
          <DetailRow
            label="Last Updated"
            value={request.updatedAt ? new Date(request.updatedAt).toLocaleString() : "—"}
          />
          <DetailRow
            label="Resolved At"
            value={request.resolvedAt ? new Date(request.resolvedAt).toLocaleString() : "—"}
          />
          <DetailRow
            label="Closed At"
            value={request.closedAt ? new Date(request.closedAt).toLocaleString() : "—"}
          />
        </div>

        {request.attachmentUrl && (
          <div className="mt-7 border-t border-gray-100 pt-6">
            <h2 className="mb-2 font-semibold text-gray-900">Attachment</h2>
            <a
              href={request.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-blue-700 underline underline-offset-4"
            >
              View attachment
            </a>
          </div>
        )}

        <div className="mt-7 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5">
          <div className="mb-3 flex items-center gap-2">
            <ClipboardList size={18} className="text-gray-600" />
            <h2 className="font-semibold text-gray-900">Resolution</h2>
          </div>

          {request.resolutionNote ? (
            <p className="whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
              {request.resolutionNote}
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              The agent has not added a resolution note yet.
            </p>
          )}
        </div>

        {isEmployee && request.status === "RESOLVED" && (
          <div className="mt-6 rounded-xl border border-green-200 bg-green-50/60 p-4 sm:p-5">
            <h2 className="font-semibold text-gray-900">Review the Resolution</h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              If the issue is fixed, close the request. If the issue persists,
              reopen it so the assigned agent can continue working.
            </p>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void updateEmployeeRequest("close")}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                Close Request
              </button>

              <button
                type="button"
                onClick={() => void updateEmployeeRequest("reopen")}
                disabled={actionLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-4 py-3 text-sm font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
              >
                {actionLoading ? <Loader2 size={17} className="animate-spin" /> : <RotateCcw size={17} />}
                Reopen Request
              </button>
            </div>
          </div>
        )}

        {isEmployee && request.status === "CLOSED" && (
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            <CheckCircle2 size={18} className="mr-2 inline text-green-600" />
            This request is closed.
          </div>
        )}

        {isAgent && (
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/60 p-4 text-sm text-blue-900">
            Agent view: use Assigned Requests to start work or update the resolution.
          </div>
        )}

        <div className="mt-6">
          <button
            type="button"
            onClick={() => void loadDetails()}
            disabled={loading || actionLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh Details
          </button>
        </div>
      </section>
    </div>
  );
}
