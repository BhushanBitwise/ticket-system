
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  PlusCircle,
  Users,
  Tags,
  Settings,
  Headset,
  X,
  type LucideIcon,
} from "lucide-react";

type UserRole = "ADMIN" | "EMPLOYEE" | "AGENT";

type AppSidebarProps = {
  role?: UserRole;
  mobileOpen: boolean;
  onClose: () => void;
};

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];
};

const allNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "EMPLOYEE", "AGENT"],
  },
  {
    label: "My Requests",
    href: "/dashboard/my-requests",
    icon: ClipboardList,
    roles: ["EMPLOYEE"],
  },
  {
    label: "Create Request",
    href: "/dashboard/create-request",
    icon: PlusCircle,
    roles: ["EMPLOYEE"],
  },
  {
    label: "Assigned Requests",
    href: "/dashboard/assigned-requests",
    icon: ClipboardList,
    roles: ["AGENT"],
  },
  {
    label: "All Requests",
    href: "/dashboard/requests",
    icon: ClipboardList,
    roles: ["ADMIN"],
  },
  {
    label: "Agents",
    href: "/dashboard/agents",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    label: "Categories",
    href: "/dashboard/categories",
    icon: Tags,
    roles: ["ADMIN"],
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    roles: ["ADMIN", "EMPLOYEE", "AGENT"],
  },
];

export default function AppSidebar({
  role = "EMPLOYEE",
  mobileOpen,
  onClose,
}: AppSidebarProps) {
  const pathname = usePathname();

  const navItems = allNavItems.filter((item) =>
    item.roles.includes(role),
  );

  return (
    <>
      {mobileOpen && (
        <button
          aria-label="Close navigation overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-gray-950 text-white transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-5">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Headset size={23} />
            </span>
            <span>
              <span className="block text-lg font-bold tracking-tight">
                ServiceDesk
              </span>
              <span className="text-xs text-gray-400">
                Internal Support Portal
              </span>
            </span>
          </Link>

          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-2 pt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            Workspace
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(`${item.href}/`));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="rounded-xl bg-white/5 p-3">
            <p className="text-sm font-semibold">Need help?</p>
            <p className="mt-1 text-xs leading-5 text-gray-400">
              Create a service request to get support from your team.
            </p>
          </div>
          <p className="mt-4 text-center text-xs text-gray-500">
            ServiceDesk Portal
          </p>
        </div>
      </aside>
    </>
  );
}
