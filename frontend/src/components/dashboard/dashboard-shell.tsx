
"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import AppSidebar from "./app-sidebar";
import AppNavbar from "./app-navbar";

import {
  apiRequest,
  AuthUser,
  getAuthUser,
  MeResponse,
  TOKEN_KEY,
} from "@/lib/api";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/my-requests": "My Requests",
  "/dashboard/create-request": "Create Request",
  "/dashboard/assigned-requests": "Assigned Requests",
  "/dashboard/requests": "All Requests",
  "/dashboard/agents": "Agent Management",
  "/dashboard/categories": "Category Management",
  "/dashboard/settings": "Settings",
};

const allowedRoles: Record<string, AuthUser["role"][]> = {
  "/dashboard/my-requests": ["EMPLOYEE"],
  "/dashboard/create-request": ["EMPLOYEE"],
  "/dashboard/assigned-requests": ["AGENT"],
  "/dashboard/requests": ["ADMIN"],
  "/dashboard/agents": ["ADMIN"],
  "/dashboard/categories": ["ADMIN"],
};

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function verifySession() {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        const result = await apiRequest<MeResponse>("/auth/me", {
          method: "GET",
          token,
        });

        const verifiedUser = getAuthUser(result);

        if (!verifiedUser?.id || !verifiedUser?.role) {
          throw new Error("Invalid user session.");
        }

        if (cancelled) return;

        setUser(verifiedUser);
        setCheckingAuth(false);
      } catch {
        localStorage.removeItem(TOKEN_KEY);

        if (!cancelled) {
          router.replace("/login");
        }
      }
    }

    setCheckingAuth(true);
    void verifySession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const matchingRoute = Object.keys(allowedRoles).find(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );

    if (
      matchingRoute &&
      !allowedRoles[matchingRoute].includes(user.role)
    ) {
      router.replace("/dashboard");
    }
  }, [pathname, router, user]);

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    router.replace("/login");
    router.refresh();
  }

  const title =
    pageTitles[pathname] ??
    Object.entries(pageTitles).find(
      ([href]) =>
        href !== "/dashboard" && pathname.startsWith(`${href}/`),
    )?.[1] ??
    "Dashboard";

  if (checkingAuth || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
          <p className="mt-4 text-sm text-slate-500">
            Verifying your session...
          </p>
        </div>
      </main>
    );
  }

  const matchingRoute = Object.keys(allowedRoles).find(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (
    matchingRoute &&
    !allowedRoles[matchingRoute].includes(user.role)
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Redirecting to your dashboard...</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AppSidebar
        role={user.role}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="min-h-screen lg:pl-64">
        <AppNavbar
          title={title}
          user={user}
          onMenuClick={() => setMobileOpen(true)}
          onLogout={handleLogout}
        />

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
