
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { apiRequest, TOKEN_KEY } from "@/lib/api";
import {
  UserPlus,
  Users,
  RefreshCw,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react";

type Agent = {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role?: string;
  isActive: boolean;
  createdAt?: string;
};

type AgentsResponse = Agent[] | { agents?: Agent[]; data?: Agent[] };

function getAgentId(agent: Agent) {
  return agent._id || agent.id || "";
}

function normalizeAgents(response: AgentsResponse): Agent[] {
  if (Array.isArray(response)) return response;
  return response.agents || response.data || [];
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [search, setSearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        throw new Error("Session not found. Please login again.");
      }

      const response = await apiRequest<AgentsResponse>("/users/agents", {
        method: "GET",
        token,
      });

      setAgents(normalizeAgents(response));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load agents.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAgents();
  }, [loadAgents]);

  async function handleCreateAgent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password;

    if (!name || !email || !password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        throw new Error("Session not found. Please login again.");
      }

      await apiRequest("/users/agents", {
        method: "POST",
        token,
        body: JSON.stringify({ name, email, password }),
      });

      setForm({ name: "", email: "", password: "" });
      setSuccess("Agent account created successfully.");
      await loadAgents();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create agent.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleStatus(agent: Agent) {
    const id = getAgentId(agent);

    if (!id) {
      setError("Agent ID is missing. Please refresh the list.");
      return;
    }

    setError("");
    setSuccess("");
    setUpdatingId(id);

    try {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        throw new Error("Session not found. Please login again.");
      }

      await apiRequest(`/users/agents/${id}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ isActive: !agent.isActive }),
      });

      setSuccess(
        `${agent.name}'s account has been ${
          agent.isActive ? "deactivated" : "activated"
        }.`,
      );

      await loadAgents();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update agent status.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  const filteredAgents = agents.filter((agent) => {
    const query = search.trim().toLowerCase();

    return (
      agent.name.toLowerCase().includes(query) ||
      agent.email.toLowerCase().includes(query)
    );
  });

  const activeCount = agents.filter((agent) => agent.isActive).length;
  const inactiveCount = agents.length - activeCount;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/dashboard"
            className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Back to Dashboard
          </Link>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Agent Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create support agent accounts and manage their access.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAgents()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh Agents
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <XCircle size={19} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Something went wrong</p>
            <p className="mt-1 break-words">{error}</p>
          </div>
          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto text-red-500 hover:text-red-800"
            aria-label="Dismiss error"
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
          <CheckCircle2 size={19} className="shrink-0" />
          <p>{success}</p>
          <button
            type="button"
            onClick={() => setSuccess("")}
            className="ml-auto"
            aria-label="Dismiss success message"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Agents" value={agents.length} icon={<Users size={20} />} />
        <StatCard
          label="Active Agents"
          value={activeCount}
          icon={<CheckCircle2 size={20} />}
        />
        <StatCard
          label="Inactive Agents"
          value={inactiveCount}
          icon={<XCircle size={20} />}
        />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <UserPlus size={21} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Create Agent</h2>
              <p className="text-sm text-gray-500">Add a support team member</p>
            </div>
          </div>

          <form onSubmit={handleCreateAgent} className="space-y-4">
            <div>
              <label
                htmlFor="agent-name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <input
                id="agent-name"
                type="text"
                autoComplete="name"
                required
                maxLength={100}
                value={form.name}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                placeholder="Enter agent name"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="agent-email"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <input
                id="agent-email"
                type="email"
                autoComplete="email"
                required
                value={form.email}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    email: event.target.value,
                  }))
                }
                placeholder="agent@company.com"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="agent-password"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Initial Password
              </label>
              <div className="relative">
                <input
                  id="agent-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      password: event.target.value,
                    }))
                  }
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 pr-11 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((previous) => !previous)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-gray-500">
                Give the initial password to the agent securely.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Creating Agent...
                </>
              ) : (
                <>
                  <UserPlus size={17} />
                  Create Agent Account
                </>
              )}
            </button>
          </form>
        </section>

        <section className="min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="font-semibold text-gray-900">Support Agents</h2>
              <p className="mt-1 text-sm text-gray-500">
                {agents.length} agent account{agents.length !== 1 ? "s" : ""} registered
              </p>
            </div>

            <div className="relative w-full sm:max-w-xs">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                aria-label="Search agents"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name or email..."
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              Loading agents...
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
              <Users size={32} className="mb-3 text-gray-300" />
              <p className="font-medium text-gray-800">
                {search ? "No matching agents found" : "No agents created yet"}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? "Try a different name or email address."
                  : "Create the first support agent using the form."}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100 md:hidden">
                {filteredAgents.map((agent) => {
                  const id = getAgentId(agent);
                  const isUpdating = updatingId === id;

                  return (
                    <div key={id || agent.email} className="space-y-3 p-5">
                      <div className="flex items-start gap-3">
                        <Avatar name={agent.name} />
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-medium text-gray-900">
                            {agent.name}
                          </p>
                          <p className="break-all text-sm text-gray-500">
                            {agent.email}
                          </p>
                        </div>
                        <StatusBadge active={agent.isActive} />
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleToggleStatus(agent)}
                        disabled={isUpdating || !id}
                        className={`w-full rounded-lg border px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
                          agent.isActive
                            ? "border-red-200 text-red-700 hover:bg-red-50"
                            : "border-green-200 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {isUpdating
                          ? "Updating..."
                          : agent.isActive
                            ? "Deactivate Account"
                            : "Activate Account"}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Agent</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 font-semibold">Created</th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredAgents.map((agent) => {
                      const id = getAgentId(agent);
                      const isUpdating = updatingId === id;

                      return (
                        <tr
                          key={id || agent.email}
                          className="transition hover:bg-gray-50/70"
                        >
                          <td className="px-5 py-4">
                            <div className="flex min-w-52 items-center gap-3">
                              <Avatar name={agent.name} />
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900">
                                  {agent.name}
                                </p>
                                <p className="break-all text-xs text-gray-500">
                                  {agent.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge active={agent.isActive} />
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                            {agent.createdAt
                              ? new Date(agent.createdAt).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => void handleToggleStatus(agent)}
                              disabled={isUpdating || !id}
                              className={`whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                                agent.isActive
                                  ? "border-red-200 text-red-700 hover:bg-red-50"
                                  : "border-green-200 text-green-700 hover:bg-green-50"
                              }`}
                            >
                              {isUpdating
                                ? "Updating..."
                                : agent.isActive
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {!loading && filteredAgents.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
              Showing {filteredAgents.length} of {agents.length} agents
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
          {icon}
        </div>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
        {value}
      </p>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-sm font-bold text-blue-700">
      {initials || "A"}
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? "bg-green-50 text-green-700"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? "bg-green-500" : "bg-gray-400"
        }`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}
