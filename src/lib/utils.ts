import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    DELIVERED: "bg-purple-100 text-purple-800",
    REVISION_REQUESTED: "bg-orange-100 text-orange-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "Pending",
    IN_PROGRESS: "In Progress",
    DELIVERED: "Delivered",
    REVISION_REQUESTED: "Revision Requested",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return labels[status] || status.replace("_", " ");
}

export function getPriorityLabel(priority: number): string {
  const labels: Record<number, string> = {
    1: "Low",
    2: "Medium",
    3: "High",
  };
  return labels[priority] || "Medium";
}

export function getPriorityColor(priority: number): string {
  const colors: Record<number, string> = {
    1: "bg-gray-100 text-gray-800",
    2: "bg-yellow-100 text-yellow-800",
    3: "bg-red-100 text-red-800",
  };
  return colors[priority] || "bg-gray-100 text-gray-800";
}

export function calculateDaysRemaining(endDate: Date): number {
  const now = Date.now();
  const end = new Date(endDate).getTime();
  const diffTime = end - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function generateRequestNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `REQ-${timestamp}-${random}`;
}
