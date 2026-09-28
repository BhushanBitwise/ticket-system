
"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ClipboardList,
  RefreshCw,
  Search,
  UserRound,
  UserCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { apiRequest, TOKEN_KEY } from "@/lib/api";

type Person = {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
};

type Category = {
  _id?: string;
  id?: string;
  name?: string;
};

type Ticket = {
  _id?: string;
  id?: string;
  requestId: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  category?: Category | string | null;
  createdBy?: Person | string | null;
  assignedTo?: Person | string | null;
  createdAt?: string;
};

type Agent = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  isActive: boolean;
};

type ListResponse<T> = T[] | { requests?: T[]; agents?: T[]; data?: T[] };

function getId(item: { _id?: string; id?: string }) {
  return item._id || item.id || "";
}

function normalizeList<T>(
  response: ListResponse<T>,
  key: "requests" | "agents",
): T[] {
  if (Array.isArray(response)) return response;
  return response[key] || response.data || [];
}

function getPersonName(person?: Person | string | null) {
  if (!person) return "—";
  if (typeof person === "string") return "Assigned";
  return person.name || person.email || "—";
}

function getCategoryName(category?: Category | string | null) {
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
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {(status || "UNKNOWN").replaceAll("_", " ")}
    </span>
  );
}

function PriorityBadge({ priority }: { priority?: string }) {
  const styles: Record<string, string> = {
    LOW: "text-gray-600 bg-gray-100",
    MEDIUM: "text-blue-700 bg-blue-50",
    HIGH: "text-orange-700 bg-orange-50",
    URGENT: "text-red-700 bg-red-50",
  };

  if (!priority) return <span className="text-gray-400">—</span>;

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        styles[priority] || "bg-gray-100 text-gray-600"
      }`}
    >
      {priority}
    </span>
  );
}

export default function AdminRequestsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState("");
  const [selectedAgents, setSelectedAgents] = useState<Record<string, string>>(
    {},
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error("Session expired. Please login again.");

      const [requestResponse, agentResponse] = await Promise.all([
        apiRequest<ListResponse<Ticket>>("/requests", {
          method: "GET",
          token,
        }),
        apiRequest<ListResponse<Agent>>("/users/agents", {
          method: "GET",
          token,
        }),
      ]);

      setTickets(normalizeList(requestResponse, "requests"));
      setAgents(normalizeList(agentResponse, "agents"));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load requests.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function assignAgent(ticket: Ticket) {
    const ticketId = getId(ticket);
    const agentId = selectedAgents[ticketId];

    setError("");
    setSuccess("");

    if (!ticketId) {
      setError("Ticket ID is missing. Refresh and try again.");
      return;
    }

    if (!agentId) {
      setError(`Please select an agent for ${ticket.requestId}.`);
      return;
    }

    if (ticket.status !== "OPEN" && ticket.status !== "ASSIGNED") {
      setError("Only OPEN or ASSIGNED tickets can be assigned or reassigned.");
      return;
    }

    const selectedAgent = agents.find((agent) => getId(agent) === agentId);

    if (!selectedAgent || !selectedAgent.isActive) {
      setError("Please select an active agent.");
      return;
    }

    setAssigningId(ticketId);

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error("Session expired. Please login again.");

      await apiRequest(`/requests/${ticketId}/assign`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ agentId }),
      });

      setSuccess(
        `${ticket.requestId} assigned successfully to ${selectedAgent.name}.`,
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to assign ticket.",
      );
    } finally {
      setAssigningId("");
    }
  }

  const filteredTickets = tickets.filter((ticket) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      (ticket.requestId || "").toLowerCase().includes(query) ||
      (ticket.title || "").toLowerCase().includes(query) ||
      getPersonName(ticket.createdBy).toLowerCase().includes(query) ||
      getPersonName(ticket.assignedTo).toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "ALL" || ticket.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const counts = {
    total: tickets.length,
    open: tickets.filter((ticket) => ticket.status === "OPEN").length,
    assigned: tickets.filter((ticket) => ticket.status === "ASSIGNED").length,
    inProgress: tickets.filter((ticket) => ticket.status === "IN_PROGRESS").length,
    resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
    closed: tickets.filter((ticket) => ticket.status === "CLOSED").length,
  };

  const activeAgents = agents.filter((agent) => agent.isActive);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <ClipboardList size={17} />
            Admin / All Requests
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            All Requests
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review employee tickets and assign them to support agents.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p className="break-words">{error}</p>
          <button
            type="button"
            className="ml-auto"
            onClick={() => setError("")}
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          <p>{success}</p>
          <button
            type="button"
            className="ml-auto"
            onClick={() => setSuccess("")}
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        <Stat label="Total" value={counts.total} />
        <Stat label="Open" value={counts.open} />
        <Stat label="Assigned" value={counts.assigned} />
        <Stat label="In Progress" value={counts.inProgress} />
        <Stat label="Resolved" value={counts.resolved} />
        <Stat label="Closed" value={counts.closed} />
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-sm">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search ID, title, employee, agent..."
              aria-label="Search requests"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by request status"
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-gray-500">
            <Loader2 size={21} className="animate-spin" />
            Loading requests and agents...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
            <ClipboardList size={34} className="mb-3 text-gray-300" />
            <p className="font-semibold text-gray-800">No requests found</p>
            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or status filter.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTickets.map((ticket) => {
              const ticketId = getId(ticket);
              const canAssign =
                ticket.status === "OPEN" || ticket.status === "ASSIGNED";
              const currentAgentId =
                typeof ticket.assignedTo === "string"
                  ? ticket.assignedTo
                  : ticket.assignedTo
                    ? getId(ticket.assignedTo)
                    : "";

              const chosenAgentId =
                selectedAgents[ticketId] || currentAgentId;
              const isAssigning = assigningId === ticketId;

              return (
                <article
                  key={ticketId || ticket.requestId}
                  className="p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-blue-700">
                          {ticket.requestId}
                        </span>
                        <StatusBadge status={ticket.status} />
                        <PriorityBadge priority={ticket.priority} />
                      </div>

                      <div>
                        <h3 className="break-words text-base font-semibold text-gray-900">
                          {ticket.title}
                        </h3>
                        {ticket.description && (
                          <p className="mt-1 line-clamp-2 break-words text-sm leading-6 text-gray-500">
                            {ticket.description}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
                        <span>
                          Category:{" "}
                          <strong className="font-medium text-gray-700">
                            {getCategoryName(ticket.category)}
                          </strong>
                        </span>
                        <span>
                          Employee:{" "}
                          <strong className="font-medium text-gray-700">
                            {getPersonName(ticket.createdBy)}
                          </strong>
                        </span>
                        <span>
                          Created:{" "}
                          <strong className="font-medium text-gray-700">
                            {ticket.createdAt
                              ? new Date(ticket.createdAt).toLocaleDateString()
                              : "—"}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 xl:max-w-sm">
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                        <UserRound size={16} />
                        Agent Assignment
                      </div>

                      {canAssign ? (
                        <>
                          <select
                            value={chosenAgentId}
                            onChange={(event) =>
                              setSelectedAgents((previous) => ({
                                ...previous,
                                [ticketId]: event.target.value,
                              }))
                            }
                            disabled={isAssigning}
                            aria-label={`Select agent for ${ticket.requestId}`}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 disabled:opacity-60"
                          >
                            <option value="">Select an active agent</option>
                            {activeAgents.map((agent) => {
                              const agentId = getId(agent);
                              return (
                                <option key={agentId} value={agentId}>
                                  {agent.name} ({agent.email})
                                </option>
                              );
                            })}
                          </select>

                          {activeAgents.length === 0 ? (
                            <p className="mt-2 text-xs text-amber-700">
                              No active agents available. Create or activate an
                              agent first.
                            </p>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void assignAgent(ticket)}
                              disabled={isAssigning || !chosenAgentId}
                              className="mt-2.5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {isAssigning ? (
                                <>
                                  <Loader2
                                    size={16}
                                    className="animate-spin"
                                  />
                                  Assigning...
                                </>
                              ) : (
                                <>
                                  <UserCheck size={16} />
                                  {ticket.status === "ASSIGNED"
                                    ? "Reassign Ticket"
                                    : "Assign Ticket"}
                                </>
                              )}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-sm">
                          <p className="text-xs text-gray-500">
                            Currently assigned to
                          </p>
                          <p className="mt-1 break-words font-medium text-gray-800">
                            {getPersonName(ticket.assignedTo)}
                          </p>
                          <p className="mt-2 text-xs text-gray-500">
                            Reassignment is available only while the ticket is
                            OPEN or ASSIGNED.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
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
      </div>
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
