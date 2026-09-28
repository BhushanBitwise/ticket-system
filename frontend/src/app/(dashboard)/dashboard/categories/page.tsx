
"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  Tags,
  Plus,
  RefreshCw,
  Search,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { apiRequest, TOKEN_KEY } from "@/lib/api";

type Category = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
};

type CategoryResponse =
  | Category[]
  | { categories?: Category[]; data?: Category[] };

function getId(category: Category) {
  return category._id || category.id || "";
}

function normalizeCategories(response: CategoryResponse): Category[] {
  if (Array.isArray(response)) return response;
  return response.categories || response.data || [];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
  });

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error("Session expired. Please login again.");

      const response = await apiRequest<CategoryResponse>("/categories", {
        method: "GET",
        token,
      });

      setCategories(normalizeCategories(response));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to load categories.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  async function handleCreateCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const name = form.name.trim();
    const description = form.description.trim();

    if (!name) {
      setError("Category name is required.");
      return;
    }

    setCreating(true);

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error("Session expired. Please login again.");

      await apiRequest("/categories", {
        method: "POST",
        token,
        body: JSON.stringify({
          name,
          description: description || undefined,
        }),
      });

      setForm({ name: "", description: "" });
      setSuccess(`Category "${name}" created successfully.`);
      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to create category.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleStatus(category: Category) {
    const id = getId(category);

    if (!id) {
      setError("Category ID is missing. Refresh and try again.");
      return;
    }

    setError("");
    setSuccess("");
    setUpdatingId(id);

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) throw new Error("Session expired. Please login again.");

      await apiRequest(`/categories/${id}/status`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ isActive: !category.isActive }),
      });

      setSuccess(
        `"${category.name}" has been ${
          category.isActive ? "deactivated" : "activated"
        }.`,
      );

      await loadCategories();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update category.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  const activeCount = categories.filter((category) => category.isActive).length;
  const inactiveCount = categories.length - activeCount;

  const filteredCategories = categories.filter((category) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      category.name.toLowerCase().includes(query) ||
      (category.description || "").toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" && category.isActive) ||
      (statusFilter === "INACTIVE" && !category.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
            <Tags size={17} />
            Admin / Category Management
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Category Management
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage the categories employees can select when creating requests.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadCategories()}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
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
            onClick={() => setError("")}
            className="ml-auto"
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
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          <p>{success}</p>
          <button
            type="button"
            onClick={() => setSuccess("")}
            className="ml-auto"
            aria-label="Dismiss success"
          >
            ✕
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total Categories" value={categories.length} />
        <StatCard label="Active Categories" value={activeCount} />
        <StatCard label="Inactive Categories" value={inactiveCount} />
      </div>

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Plus size={21} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Create Category</h2>
              <p className="text-sm text-gray-500">
                Add a request category
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label
                htmlFor="category-name"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Category Name <span className="text-red-600">*</span>
              </label>
              <input
                id="category-name"
                type="text"
                required
                maxLength={100}
                value={form.name}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                placeholder="e.g. Network / Internet"
                className="w-full rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label
                htmlFor="category-description"
                className="mb-1.5 block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                id="category-description"
                rows={4}
                maxLength={500}
                value={form.description}
                onChange={(event) =>
                  setForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                placeholder="Describe when this category should be used..."
                className="w-full resize-y rounded-xl border border-gray-300 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <p className="mt-1 text-right text-xs text-gray-400">
                {form.description.length}/500
              </p>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {creating ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Creating Category...
                </>
              ) : (
                <>
                  <Plus size={17} />
                  Create Category
                </>
              )}
            </button>
          </form>
        </section>

        <section className="min-w-0 rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="font-semibold text-gray-900">All Categories</h2>
              <p className="mt-1 text-sm text-gray-500">
                {categories.length} category
                {categories.length !== 1 ? "ies" : ""} registered
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="search"
                  aria-label="Search categories"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search categories..."
                  className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 sm:w-48"
                />
              </div>

              <select
                aria-label="Filter categories by status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-52 items-center justify-center gap-3 text-sm text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              Loading categories...
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex min-h-52 flex-col items-center justify-center px-6 text-center">
              <Tags size={32} className="mb-3 text-gray-300" />
              <p className="font-medium text-gray-800">
                {search || statusFilter !== "ALL"
                  ? "No matching categories"
                  : "No categories created yet"}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {search || statusFilter !== "ALL"
                  ? "Try changing your search or filter."
                  : "Create your first category using the form."}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-100 md:hidden">
                {filteredCategories.map((category) => {
                  const id = getId(category);
                  const busy = updatingId === id;

                  return (
                    <div key={id || category.name} className="space-y-3 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="break-words font-semibold text-gray-900">
                            {category.name}
                          </p>
                          <p className="mt-1 break-words text-sm leading-5 text-gray-500">
                            {category.description || "No description"}
                          </p>
                        </div>
                        <StatusBadge active={category.isActive} />
                      </div>

                      <button
                        type="button"
                        onClick={() => void handleToggleStatus(category)}
                        disabled={busy || !id}
                        className={`inline-flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:opacity-50 ${
                          category.isActive
                            ? "border-red-200 text-red-700 hover:bg-red-50"
                            : "border-green-200 text-green-700 hover:bg-green-50"
                        }`}
                      >
                        {busy ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : category.isActive ? (
                          <ToggleRight size={17} />
                        ) : (
                          <ToggleLeft size={17} />
                        )}
                        {category.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Category</th>
                      <th className="px-5 py-4 font-semibold">Status</th>
                      <th className="px-5 py-4 font-semibold">Created</th>
                      <th className="px-5 py-4 text-right font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredCategories.map((category) => {
                      const id = getId(category);
                      const busy = updatingId === id;

                      return (
                        <tr
                          key={id || category.name}
                          className="transition hover:bg-gray-50/70"
                        >
                          <td className="px-5 py-4">
                            <p className="font-medium text-gray-900">
                              {category.name}
                            </p>
                            <p className="mt-1 max-w-sm break-words text-xs leading-5 text-gray-500">
                              {category.description || "No description"}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <StatusBadge active={category.isActive} />
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                            {category.createdAt
                              ? new Date(category.createdAt).toLocaleDateString()
                              : "—"}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => void handleToggleStatus(category)}
                              disabled={busy || !id}
                              className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:opacity-50 ${
                                category.isActive
                                  ? "border-red-200 text-red-700 hover:bg-red-50"
                                  : "border-green-200 text-green-700 hover:bg-green-50"
                              }`}
                            >
                              {busy ? (
                                <Loader2 size={15} className="animate-spin" />
                              ) : category.isActive ? (
                                <ToggleRight size={15} />
                              ) : (
                                <ToggleLeft size={15} />
                              )}
                              {category.isActive ? "Deactivate" : "Activate"}
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

          {!loading && filteredCategories.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-3 text-xs text-gray-500">
              Showing {filteredCategories.length} of {categories.length} categories
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
        {value}
      </p>
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
