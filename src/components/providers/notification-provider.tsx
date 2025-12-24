"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";

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

// Helper function to play notification sound
// Plays the custom notification.wav audio file
function playNotificationSound() {
  // Check if we're in browser environment
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  try {
    const audio = new Audio("/sounds/notification.wav");
    audio.volume = 1; // Set volume to 100%
    audio.play().catch((error) => {
      // Silently fail if audio is not allowed (e.g., no user interaction yet)
      // This is expected for the first notification before any user interaction
      if (!error.message.includes("user didn't interact")) {
        console.error("Failed to play notification sound:", error);
      }
    });
  } catch (error) {
    console.error("Failed to create notification sound:", error);
  }
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
  const locale = useLocale();
  const t = useTranslations();
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
        new Notification(notification.title, {
          body: notification.message,
          icon: "/favicon.ico",
          badge: "/favicon.ico",
        });
      }
    },
    [hasPermission]
  );

  const handleNotificationMessage = useCallback(
    (notification: RealtimeNotification) => {
      if (!notification.title || !notification.message) return;

      const currentPath = globalThis.location.pathname;

      const linkWithLocale = (() => {
        if (!notification.link) return undefined;
        const path = notification.link;
        const first = path
          .split("/")
          .filter(Boolean)
          .find(() => true);
        const locales = ["en", "ar"];
        const startsWithLocale = locales.includes(first as any);
        if (startsWithLocale) return path;
        const normalized = path.startsWith("/") ? path : `/${path}`;
        return `/${locale}${normalized}`;
      })();

      toast.info(notification.title, {
        description: notification.message,
        action: linkWithLocale
          ? {
              label: t("admin.requests.actions.view"),
              onClick: () => navigateToNotification(linkWithLocale, currentPath, router),
            }
          : undefined,
      });

      setUnreadCount((prev) => prev + 1);
      showDesktopNotification(notification);

      // Play notification sound
      playNotificationSound();
    },
    [router, showDesktopNotification, locale, t]
  );

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
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
        toast.error(t("client.notifications.title"), {
          description: t("client.notifications.noNotificationsDesc"),
          duration: 10000,
        });
        return;
      }

      const delay = calculateReconnectDelay(reconnectAttempts);

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
    };

    const handleError = (connect: () => void) => {
      if (!isMounted) return;
      setIsConnected(false);
      es?.close();
      scheduleReconnect(connect);
    };

    const handleMessage = (event: MessageEvent) => {
      if (!isMounted) return;

      try {
        const notification: RealtimeNotification = JSON.parse(event.data);

        if (notification.type === "connected") return;

        handleNotificationMessage(notification);
      } catch (error) {
        console.error("Error parsing notification:", error);
      }
    };

    const connect = () => {
      if (!isMounted) return;

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
