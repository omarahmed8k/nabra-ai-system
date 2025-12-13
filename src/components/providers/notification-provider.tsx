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

// Helper function to calculate reconnection delay
function calculateReconnectDelay(attempts: number): number {
  const baseDelay = 1000; // 1 second
  const maxDelay = 30000; // 30 seconds
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempts - 1), maxDelay);
  const jitter = Math.random() * 1000;
  return exponentialDelay + jitter;
}

// Helper function to handle notification navigation
function navigateToNotification(targetPath: string, currentPath: string, router: any) {
  if (currentPath === targetPath) {
    globalThis.location.reload();
  } else {
    router.push(targetPath);
  }
}

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
      try {
        const permission = await Notification.requestPermission();
        const granted = permission === "granted";
        setHasPermission(granted);
        return granted;
      } catch (error) {
        console.error("Error requesting notification permission:", error);
        return false;
      }
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

  const handleNotificationMessage = useCallback(
    (notification: RealtimeNotification) => {
      if (!notification.title || !notification.message) return;

      const currentPath = globalThis.location.pathname;

      toast.info(notification.title, {
        description: notification.message,
        action: notification.link
          ? {
              label: "View",
              onClick: () => navigateToNotification(notification.link!, currentPath, router),
            }
          : undefined,
      });

      console.log("🔔 Toast notification shown");
      setUnreadCount((prev) => prev + 1);
      showDesktopNotification(notification);
    },
    [router, showDesktopNotification]
  );

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
      console.log("🔴 Notification: Not authenticated, skipping SSE connection");
      return;
    }

    let es: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let isMounted = true;
    let reconnectAttempts = 0;

    const scheduleReconnect = (connect: () => void) => {
      const maxAttempts = 10;
      reconnectAttempts += 1;

      if (reconnectAttempts > maxAttempts) {
        console.error("❌ Max reconnection attempts reached. Please refresh the page.");
        toast.error("Connection lost", {
          description: "Unable to reconnect to notification service. Please refresh the page.",
          duration: 10000,
        });
        return;
      }

      const delay = calculateReconnectDelay(reconnectAttempts);
      console.log(
        `🔄 Attempting to reconnect (${reconnectAttempts}/${maxAttempts}) in ${Math.round(delay / 1000)}s...`
      );

      reconnectTimeout = setTimeout(() => {
        if (isMounted) {
          connect();
        }
      }, delay);
    };

    const handleOpen = () => {
      if (!isMounted) return;
      setIsConnected(true);
      reconnectAttempts = 0;
      console.log("✅ Connected to notification stream");
    };

    const handleError = (connect: () => void) => {
      if (!isMounted) return;
      setIsConnected(false);
      console.log("❌ Notification stream disconnected");
      es?.close();
      scheduleReconnect(connect);
    };

    const handleMessage = (event: MessageEvent) => {
      if (!isMounted) return;

      try {
        const notification: RealtimeNotification = JSON.parse(event.data);
        console.log("📬 Received notification:", notification);

        if (notification.type === "connected") return;

        handleNotificationMessage(notification);
      } catch (error) {
        console.error("Error parsing notification:", error);
      }
    };

    const connect = () => {
      if (!isMounted) return;

      console.log("🟡 Notification: Connecting to SSE...");

      try {
        es = new EventSource("/api/notifications/sse");
        es.onopen = () => handleOpen();
        es.onerror = () => handleError(connect);
        es.onmessage = handleMessage;
      } catch (error) {
        console.error("❌ Failed to create EventSource:", error);
        if (isMounted) {
          setIsConnected(false);
        }
      }
    };

    connect();

    return () => {
      console.log("🔴 Cleaning up SSE connection");
      isMounted = false;

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }

      if (es) {
        es.close();
      }

      setIsConnected(false);
    };
  }, [session, status, handleNotificationMessage]);

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
