
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Send,
} from "lucide-react";
import { apiRequest, TOKEN_KEY } from "@/lib/api";

type Category = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  isActive?: boolean;
};

type CategoryResponse =
  | Category[]
  | { categories?: Category[]; data?: Category[] };

type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

type CreatedRequest = {
  requestId?: string;
  _id?: string;
  title?: string;
};

type CreateRequestResponse = {
  message?: string;
  request?: CreatedRequest;
  data?: CreatedRequest;
};

export default function CreateRequestPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [priority, setPriority] = useState<Priority>("MEDIUM");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadCategories() {
      try {
        const token = localStorage.getItem(TOKEN_KEY);

        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await apiRequest<CategoryResponse>(
          "/categories/active",
          { method: "GET", token },
        );

        const items = Array.isArray(response)
          ? response
          : response.categories ?? response.data ?? [];

        const activeItems = items.filter(
          (category) => category.isActive !== false,
        );

        setCategories(activeItems);

        if (activeItems.length === 0) {
          setError(
            "No active categories found. Please contact your administrator.",
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load categories.",
        );
      } finally {
        setLoadingCategories(false);
      }
    }

    void loadCategories();
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }

    if (trimmedTitle.length < 3) {
      setError("Title must contain at least 3 characters.");
      return;
    }

    if (trimmedDescription.length < 10) {
      setError("Description must contain at least 10 characters.");
      return;
    }

    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      router.replace("/login");
      return;
    }

    setSubmitting(true);

    try {
      const response = await apiRequest<CreateRequestResponse>(
        "/requests",
        {
          method: "POST",
          token,
          body: JSON.stringify({
            title: trimmedTitle,
            description: trimmedDescription,
            categoryId,
            priority,
          }),
        },
      );

      const createdRequest = response.request ?? response.data;
      const generatedId = createdRequest?.requestId;

      setSuccess(
        generatedId
          ? `Request created successfully! Your Request ID is ${generatedId}.`
          : response.message ?? "Request created successfully!",
      );

      setTitle("");
      setDescription("");
      setCategoryId("");
      setPriority("MEDIUM");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create the request. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-blue-600">
          EMPLOYEE PORTAL
        </p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
          Create a Service Request
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Describe your issue so the support team can help you.
        </p>
      </div>

      {success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800"
        >
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">Request submitted</p>
            <p className="mt-1">{success}</p>
            <button
              type="button"
              onClick={() => router.push("/dashboard/my-requests")}
              className="mt-3 font-semibold underline underline-offset-2"
            >
              Go to My Requests
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div className="space-y-2">
          <label
            htmlFor="category"
            className="block text-sm font-semibold text-slate-700"
          >
            Category <span className="text-red-500">*</span>
          </label>

          <select
            id="category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            disabled={loadingCategories || categories.length === 0}
            required
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100"
          >
            <option value="">
              {loadingCategories
                ? "Loading categories..."
                : "Select a category"}
            </option>

            {categories.map((category) => {
              const id = category._id ?? category.id ?? "";

              return (
                <option key={id || category.name} value={id}>
                  {category.name}
                </option>
              );
            })}
          </select>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="title"
            className="block text-sm font-semibold text-slate-700"
          >
            Request Title <span className="text-red-500">*</span>
          </label>

          <input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Example: Laptop is not starting"
            minLength={3}
            maxLength={120}
            required
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-slate-700"
          >
            Description <span className="text-red-500">*</span>
          </label>

          <textarea
            id="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Explain the problem and any steps you have already tried..."
            minLength={10}
            maxLength={3000}
            rows={5}
            required
            className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />

          <p className="text-right text-xs text-slate-400">
            {description.length}/3000 characters
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="priority"
            className="block text-sm font-semibold text-slate-700"
          >
            Priority
          </label>

          <select
            id="priority"
            value={priority}
            onChange={(event) =>
              setPriority(event.target.value as Priority)
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>

          <p className="text-xs text-slate-500">
            Select the priority according to the impact of your issue.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setTitle("");
              setDescription("");
              setCategoryId("");
              setPriority("MEDIUM");
              setError("");
              setSuccess("");
            }}
            disabled={submitting}
            className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Clear Form
          </button>

          <button
            type="submit"
            disabled={submitting || loadingCategories || categories.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
