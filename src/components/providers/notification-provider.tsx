"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface RealtimeNotification {
  type: "message" | "status_change" | "assignment" | "general" | "connected";
  title?: string;
  message?: string;
  data?: any;
  link?: string;
  timestamp?: Date;
}

interface NotificationContextType {
  isConnected: boolean;
  requestPermission: () => Promise<boolean>;
  hasPermission: boolean;
  unreadCount: number;
  refreshUnreadCount: () => void;
}

const NotificationContext = createContext<NotificationContextType>({
  isConnected: false,
  requestPermission: async () => false,
  hasPermission: false,
  unreadCount: 0,
  refreshUnreadCount: () => {},
});

export function NotificationProvider({ children }: { readonly children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check initial permission
  useEffect(() => {
    if (globalThis.window !== undefined && "Notification" in globalThis) {
      setHasPermission(Notification.permission === "granted");
    }
  }, []);

  // Fetch unread notification count
  const fetchUnreadCount = useCallback(async () => {
    if (status !== "authenticated" || !session?.user) return;

    try {
      const response = await fetch("/api/notifications/unread-count");
      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  }, [session, status]);

  // Fetch initial count
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  const requestPermission = useCallback(async () => {
    if (globalThis.window === undefined || !("Notification" in globalThis)) {
      return false;
    }

    if (Notification.permission === "granted") {
      setHasPermission(true);
      return true;
    }

    if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      const granted = permission === "granted";
      setHasPermission(granted);
      return granted;
    }

    return false;
  }, []);

  const showDesktopNotification = useCallback(
    (notification: RealtimeNotification) => {
      if (hasPermission && notification.title) {
        console.log("🔔 Showing desktop notification:", notification.title);
        new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
        });
      } else if (!hasPermission) {
        console.log("⚠️ Desktop notifications not permitted");
      }
    },
    [hasPermission]
  );

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
      console.log("🔴 Notification: Not authenticated, skipping SSE connection");
      return;
    }

    console.log("🟡 Notification: Connecting to SSE...");

    // Connect to SSE endpoint
    const es = new EventSource("/api/notifications/sse");

    es.onopen = () => {
      setIsConnected(true);
      console.log("✅ Connected to notification stream");
    };

    es.onerror = (error) => {
      setIsConnected(false);
      console.log("❌ Notification stream disconnected", error);
    };

    es.onmessage = (event) => {
      try {
        const notification: RealtimeNotification = JSON.parse(event.data);

        console.log("📬 Received notification:", notification);

        if (notification.type === "connected") {
          return;
        }

        // Show toast notification
        if (notification.title && notification.message) {
          toast.info(notification.title, {
            description: notification.message,
            action: notification.link
              ? {
                  label: "View",
                  onClick: () => router.push(notification.link!),
                }
              : undefined,
          });
          console.log("🔔 Toast notification shown");

          // Increment unread count
          setUnreadCount((prev) => prev + 1);
        }

        // Show desktop notification if permission granted
        showDesktopNotification(notification);
      } catch (error) {
        console.error("Error parsing notification:", error);
      }
    };

    return () => {
      console.log("🔴 Closing SSE connection");
      es.close();
      setIsConnected(false);
    };
  }, [session, status, showDesktopNotification, router]);

  const contextValue = useMemo(
    () => ({
      isConnected,
      requestPermission,
      hasPermission,
      unreadCount,
      refreshUnreadCount: fetchUnreadCount,
    }),
    [isConnected, requestPermission, hasPermission, unreadCount, fetchUnreadCount]
  );

  return (
    <NotificationContext.Provider value={contextValue}>{children}</NotificationContext.Provider>
  );
}

export function useRealtimeNotifications() {
  return useContext(NotificationContext);
}
