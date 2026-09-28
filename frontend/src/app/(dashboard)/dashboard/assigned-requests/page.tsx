
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  RefreshCw,
  Search,
  Loader2,
  Play,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { apiRequest, TOKEN_KEY } from "@/lib/api";

type Ticket = {
  _id?: string;
  id?: string;
  requestId: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  category?: { name?: string } | string | null;
  createdBy?: { name?: string; email?: string } | string | null;
  assignedTo?: { name?: string; email?: string } | string | null;
  resolutionNote?: string | null;
  createdAt?: string;
};

type ListResponse =
  | Ticket[]
  | { requests?: Ticket[]; data?: Ticket[] };

function getId(ticket: Ticket) {
  return ticket._id || ticket.id || "";
}

function normalizeTickets(response: ListResponse): Ticket[] {
  if (Array.isArray(response)) return response;
  return response.requests || response.data || [];
}

function personName(person?: Ticket["createdBy"]) {
  if (!person) return "—";
  if (typeof person === "string") return "—";
  return person.name || person.email || "—";
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    ASSIGNED: "bg-violet-50 text-violet-700",
    IN_PROGRESS: "bg-amber-50 text-amber-700",
    RESOLVED: "bg-green-50 text-green-700",
    CLOSED: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[status] || "bg-blue-50 text-blue-700"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}

export default function AssignedRequestsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error("Session expired. Please login again.");

      const response = await apiRequest<ListResponse>("/requests/assigned", {
        method: "GET",
        token,
      });

      setTickets(normalizeTickets(response));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load assigned requests.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  async function updateTicket(
    ticket: Ticket,
    action: "start" | "resolve",
  ) {
    const id = getId(ticket);
    setError("");
    setSuccess("");

    if (!id) {
      setError("Ticket ID is missing. Refresh and try again.");
      return;
    }

    if (action === "start" && ticket.status !== "ASSIGNED") {
      setError("Only assigned tickets can be started.");
      return;
    }

    if (action === "resolve" && ticket.status !== "IN_PROGRESS") {
      setError("Start work before resolving the ticket.");
      return;
    }

    const resolutionNote = (notes[id] || "").trim();

    if (action === "resolve" && !resolutionNote) {
      setError("Please enter a resolution note before resolving the ticket.");
      return;
    }

    setActionId(id);

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error("Session expired. Please login again.");

      await apiRequest(`/requests/${id}/${action}`, {
        method: "PATCH",
        token,
        body: JSON.stringify(
          action === "resolve" ? { resolutionNote } : {},
        ),
      });

      setSuccess(
        `${ticket.requestId} ${
          action === "start"
            ? "is now in progress."
            : "has been marked as resolved."
        }`,
      );

      setNotes((previous) => ({ ...previous, [id]: "" }));
      await loadTickets();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update ticket.",
      );
    } finally {
      setActionId("");
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      (ticket.requestId || "").toLowerCase().includes(query) ||
      (ticket.title || "").toLowerCase().includes(query) ||
      personName(ticket.createdBy).toLowerCase().includes(query);

    const matchesStatus = filter === "ALL" || ticket.status === filter;

    return matchesSearch && matchesStatus;
  });

  const assignedCount = tickets.filter(
    (ticket) => ticket.status === "ASSIGNED",
  ).length;
  const inProgressCount = tickets.filter(
    (ticket) => ticket.status === "IN_PROGRESS",
  ).length;
  const resolvedCount = tickets.filter(
    (ticket) => ticket.status === "RESOLVED",
  ).length;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <ClipboardList size={17} />
            Agent / Assigned Requests
          </div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Assigned Requests
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Start assigned work, record the fix, and resolve requests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadTickets()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="shrink-0" />
          <p className="break-words">{error}</p>
          <button type="button" className="ml-auto" onClick={() => setError("")}>✕</button>
        </div>
      )}

      {success && (
        <div role="status" className="flex gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 size={19} className="shrink-0" />
          <p>{success}</p>
          <button type="button" className="ml-auto" onClick={() => setSuccess("")}>✕</button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total Assigned to Me" value={tickets.length} />
        <Stat label="Assigned" value={assignedCount} />
        <Stat label="In Progress" value={inProgressCount} />
        <Stat label="Resolved" value={resolvedCount} />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-sm">
            <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search request ID, title, employee..."
              aria-label="Search assigned requests"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            aria-label="Filter requests by status"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="ALL">All statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-gray-500">
            <Loader2 size={20} className="animate-spin" />
            Loading assigned requests...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center">
            <ClipboardList size={34} className="mb-3 text-gray-300" />
            <p className="font-semibold text-gray-800">No requests found</p>
            <p className="mt-1 text-sm text-gray-500">
              Assigned tickets will appear here when the Admin assigns them to you.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTickets.map((ticket) => {
              const id = getId(ticket);
              const busy = actionId === id;
              const canStart = ticket.status === "ASSIGNED";
              const canResolve = ticket.status === "IN_PROGRESS";

              return (
                <article key={id || ticket.requestId} className="space-y-4 p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-blue-700">{ticket.requestId}</span>
                        <StatusBadge status={ticket.status} />
                        {ticket.priority && (
                          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">
                            {ticket.priority}
                          </span>
                        )}
                      </div>
                      <h2 className="break-words text-base font-semibold text-gray-900">{ticket.title}</h2>
                      {ticket.description && (
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-gray-500">
                          {ticket.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs text-gray-500">
                        Reported by: {personName(ticket.createdBy)}
                        {ticket.createdAt
                          ? ` · ${new Date(ticket.createdAt).toLocaleDateString()}`
                          : ""}
                      </p>
                    </div>

                    {id && (
                      <Link
                        href={`/dashboard/my-requests/${id}`}
                        className="inline-flex h-fit items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        View Details <ExternalLink size={15} />
                      </Link>
                    )}
                  </div>

                  {canStart && (
                    <button
                      type="button"
                      onClick={() => void updateTicket(ticket, "start")}
                      disabled={busy}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
                    >
                      {busy ? <Loader2 size={17} className="animate-spin" /> : <Play size={17} />}
                      Start Work
                    </button>
                  )}

                  {canResolve && (
                    <div className="space-y-3 rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                      <label htmlFor={`resolution-${id}`} className="block text-sm font-semibold text-gray-800">
                        Resolution Note <span className="text-red-600">*</span>
                      </label>
                      <textarea
                        id={`resolution-${id}`}
                        rows={3}
                        maxLength={3000}
                        value={notes[id] || ""}
                        onChange={(event) =>
                          setNotes((previous) => ({
                            ...previous,
                            [id]: event.target.value,
                          }))
                        }
                        placeholder="Explain what you fixed and any steps taken..."
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                      <button
                        type="button"
                        onClick={() => void updateTicket(ticket, "resolve")}
                        disabled={busy || !(notes[id] || "").trim()}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 sm:w-auto"
                      >
                        {busy ? <Loader2 size={17} className="animate-spin" /> : <CheckCircle2 size={17} />}
                        Resolve Request
                      </button>
                    </div>
                  )}

                  {ticket.status === "RESOLVED" && (
                    <p className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
                      This request is resolved. The employee can review the resolution and close or reopen it.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {!loading && filteredTickets.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
            Showing {filteredTickets.length} of {tickets.length} requests
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
