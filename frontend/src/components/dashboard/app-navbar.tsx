
"use client";

import { useState } from "react";
import { Menu, Bell, ChevronDown, LogOut } from "lucide-react";
import type { AuthUser } from "@/lib/api";

type AppNavbarProps = {
  onMenuClick: () => void;
  title: string;
  user: AuthUser;
  onLogout: () => void;
};

export default function AppNavbar({
  onMenuClick,
  title,
  user,
  onLogout,
}: AppNavbarProps) {
  const [profileOpen, setProfileOpen] = useState(false);

  const initials = user.name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu size={22} />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold text-slate-900">
            {title}
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            Internal Complaint & Service Request Management
          </p>
        </div>
      </div>

      <div className="ml-3 flex shrink-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          aria-label="Notifications"
          title="Notifications"
          className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100"
        >
          <Bell size={20} />
        </button>

        <div className="hidden h-8 w-px bg-slate-200 sm:block" />

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((open) => !open)}
            aria-expanded={profileOpen}
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-50"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
              {initials || "U"}
            </span>
            <span className="hidden max-w-44 text-left sm:block">
              <span className="block truncate text-sm font-semibold text-slate-800">
                {user.name}
              </span>
              <span className="block text-xs text-slate-500">
                {user.role}
              </span>
            </span>
            <ChevronDown size={16} className="hidden text-slate-400 sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
              <p className="truncate text-sm font-semibold text-slate-900">
                {user.name}
              </p>
              <p className="mt-1 truncate text-xs text-slate-500">
                {user.email}
              </p>
              <div className="my-3 border-t border-slate-100" />
              <button
                type="button"
                onClick={onLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut size={17} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
