"use client";

import { MessageCircle } from "lucide-react";
import { Link } from "@/i18n/routing";

const WHATSAPP_NUMBER = "201207401576";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

export function WhatsAppSupport() {
  return (
    <Link
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
      aria-label="Contact us on WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
        Chat on WhatsApp
      </span>
    </Link>
  );
}

export function WhatsAppButton({
  children = "WhatsApp Support",
  className = "",
  size = "default",
}: Readonly<{
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "default" | "lg";
}>) {
  const sizeClasses = {
    sm: "px-3 py-2 text-sm",
    default: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <Link
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors ${sizeClasses[size]} ${className}`}
    >
      <MessageCircle className="h-4 w-4" />
      {children}
    </Link>
  );
}

export function WhatsAppLink({
  children = "Contact support on WhatsApp",
  className = "",
}: Readonly<{
  children?: React.ReactNode;
  className?: string;
}>) {
  return (
    <Link
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-green-600 hover:text-green-700 hover:underline font-medium inline-flex items-center gap-1 ${className}`}
    >
      {children}
    </Link>
  );
}
