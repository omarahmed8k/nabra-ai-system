"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc/client";
import { formatDateTime } from "@/lib/utils";
import { Bell, Check } from "lucide-react";

export default function ProviderNotificationsPage() {
  const utils = trpc.useUtils();
  const { data: notifications, isLoading } =
    trpc.notification.getAll.useQuery();

  const markAsRead = trpc.notification.markAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getAll.invalidate();
    },
  });

  const markAllAsRead = trpc.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.notification.getAll.invalidate();
    },
  });

  const unreadCount = notifications?.notifications.filter((n) => !n.isRead).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated on your jobs and activity
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <Check className="mr-2 h-4 w-4" />
            Mark All as Read
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : notifications?.notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p className="text-lg font-medium">No notifications</p>
              <p className="text-sm">
                You&apos;ll see updates about your jobs here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications?.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    notification.isRead
                      ? "bg-background"
                      : "bg-primary/5 border-primary/20"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{notification.title}</p>
                        {!notification.isRead && (
                          <Badge variant="default" className="text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDateTime(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          markAsRead.mutate({ id: notification.id })
                        }
                        disabled={markAsRead.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
