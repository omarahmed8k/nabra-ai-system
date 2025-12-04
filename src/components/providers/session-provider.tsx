"use client";

import { SessionProvider } from "next-auth/react";

interface Props {
  readonly children: React.ReactNode;
}

export function AuthProvider({ children }: Props) {
  return <SessionProvider>{children}</SessionProvider>;
}
