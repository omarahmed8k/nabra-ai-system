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
  User,
  Users,
  Workflow,
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
  { href: "/client/profile", label: "Profile", icon: User },
];

const providerNavItems = [
  { href: "/provider", label: "Dashboard", icon: LayoutDashboard },
  { href: "/provider/available", label: "Available Jobs", icon: Workflow },
  { href: "/provider/my-requests", label: "My Requests", icon: FileText },
  { href: "/provider/notifications", label: "Notifications", icon: Bell },
  { href: "/provider/profile", label: "Profile", icon: User },
];

const adminNavItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/requests", label: "All Requests", icon: FileText },
  { href: "/admin/payments", label: "Payments", icon: CheckCircle },
  { href: "/admin/packages", label: "Packages", icon: CreditCard },
  { href: "/admin/services", label: "Services", icon: Settings },
  { href: "/admin/profile", label: "Profile", icon: User },
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
      <div className="lg:hidden sticky top-0 z-50 flex h-14 sm:h-16 items-center gap-3 sm:gap-4 border-b bg-background px-3 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-9 w-9 sm:h-10 sm:w-10"
        >
          {sidebarOpen ? (
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </Button>
        <Link href={basePath} className="flex items-center gap-2 flex-1">
          <Image
            src="/images/logo.svg"
            alt="Nabra"
            width={32}
            height={32}
            className="w-auto h-6 sm:h-8"
          />
          <span className="font-semibold text-sm sm:text-base">Nabra</span>
        </Link>
        {unreadCount > 0 && (
          <Badge variant="destructive" className="h-5 min-w-5 px-1 text-xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 sm:w-72 lg:w-64 transform bg-background border-r transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-14 sm:h-16 items-center gap-2 border-b px-4 sm:px-6">
            <Link href={basePath} className="flex items-center gap-2">
              <Image
                src="/images/logo.svg"
                alt="Nabra"
                width={32}
                height={32}
                className="w-auto h-6 sm:h-8"
              />
              <span className="font-semibold text-base sm:text-lg">Nabra</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 sm:space-y-1 px-2 sm:px-3 py-3 sm:py-4 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const isNotifications = item.href.includes("/notifications");
              const showBadge = isNotifications && unreadCount > 0;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 sm:py-2.5 text-xs sm:text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {showBadge && (
                    <Badge
                      variant="destructive"
                      className="ml-auto h-4 sm:h-5 min-w-4 sm:min-w-5 flex items-center justify-center px-1 text-[10px] sm:text-xs"
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
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarImage src={session?.user?.image || ""} />
                <AvatarFallback className="text-xs sm:text-sm">
                  {getInitials(session?.user?.name || "U")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs sm:text-sm font-medium truncate">{session?.user?.name}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  {session?.user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start text-xs sm:text-sm"
              onClick={() => signOut({ callbackUrl: "/" })}
            >
              <LogOut className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
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
      <main className="lg:pl-64 min-h-screen">
        <div className="p-3 sm:p-4 md:p-6">
          <NotificationPermissionBanner />
          {children}
        </div>
      </main>
    </div>
  );
}
