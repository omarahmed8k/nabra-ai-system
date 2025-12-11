"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { NotificationPermissionBanner } from "@/components/ui/notification-permission-banner";
import { useRealtimeNotifications } from "@/components/providers/notification-provider";
import {
  LayoutDashboard,
  FileText,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Wallet,
  CheckCircle,
} from "lucide-react";
import { useState } from "react";
import { getInitials } from "@/lib/utils";

const clientNavItems = [
  { href: "/client", label: "Dashboard", icon: LayoutDashboard },
  { href: "/client/requests", label: "Requests", icon: FileText },
  { href: "/client/subscription", label: "Subscription", icon: CreditCard },
  { href: "/client/payment", label: "Payment", icon: Wallet },
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
  { href: "/admin/payments", label: "Payments", icon: CheckCircle },
  { href: "/admin/packages", label: "Packages", icon: CreditCard },
  { href: "/admin/services", label: "Services", icon: Settings },
];

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { unreadCount } = useRealtimeNotifications();

  const role = session?.user?.role;

  const getNavItems = () => {
    if (role === "SUPER_ADMIN") return adminNavItems;
    if (role === "PROVIDER") return providerNavItems;
    return clientNavItems;
  };

  const getBasePath = () => {
    if (role === "SUPER_ADMIN") return "/admin";
    if (role === "PROVIDER") return "/provider";
    return "/client";
  };

  const navItems = getNavItems();
  const basePath = getBasePath();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <div className="lg:hidden sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background px-4">
        <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
        <Link href={basePath} className="flex items-center gap-2">
          <Image src="/images/logo.svg" alt="Nabra" width={32} height={32} className="w-auto h-8" />
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
              <Image
                src="/images/logo.svg"
                alt="Nabra"
                width={32}
                height={32}
                className="w-auto h-8"
              />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const isNotifications = item.href.includes("/notifications");
              const showBadge = isNotifications && unreadCount > 0;

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
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <Badge
                      variant="destructive"
                      className="ml-auto h-5 min-w-5 flex items-center justify-center px-1 text-xs"
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </Badge>
                  )}
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
                <AvatarFallback>{getInitials(session?.user?.name || "U")}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{session?.user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
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
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden cursor-default"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="lg:pl-64">
        <div className="p-6">
          <NotificationPermissionBanner />
          {children}
        </div>
      </main>
    </div>
  );
}
