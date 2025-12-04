"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { getInitials } from "@/lib/utils";

const clientNavItems = [
  { href: "/client", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/requests", label: "Requests", icon: FileText },
  { href: "/client/subscription", label: "Subscription", icon: CreditCard },
  { href: "/client/notifications", label: "Notifications", icon: Bell },
];

const providerNavItems = [
  { href: "/provider", label: "Dashboard", icon: LayoutDashboard },
  { href: "/provider/available", label: "Available Jobs", icon: FileText },
  { href: "/provider/my-requests", label: "My Requests", icon: FileText },
  { href: "/provider/notifications", label: "Notifications", icon: Bell },
];

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: FileText },
  { href: "/admin/requests", label: "All Requests", icon: FileText },
  { href: "/admin/packages", label: "Packages", icon: CreditCard },
  { href: "/admin/services", label: "Services", icon: Settings },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const role = session?.user?.role;
  const navItems =
    role === "SUPER_ADMIN"
      ? adminNavItems
      : role === "PROVIDER"
      ? providerNavItems
      : clientNavItems;

  const basePath =
    role === "SUPER_ADMIN" ? "/admin" : role === "PROVIDER" ? "/provider" : "/client";

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
        <Link href={basePath} className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-lg font-bold text-primary-foreground">N</span>
          </div>
          <span className="font-bold">Nabra</span>
        </Link>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-background border-r transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <Link href={basePath} className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-lg font-bold text-primary-foreground">N</span>
              </div>
              <span className="font-bold text-lg">Nabra</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Separator />

          {/* User section */}
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Avatar>
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback>
                  {getInitials(session?.user?.name || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
