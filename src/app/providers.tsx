"use client";

import { AuthProvider } from "@/lib/firebase/auth-context";
import { NativeIosDocumentClass } from "@/lib/native-ios-document";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NativeIosDocumentClass />
      {children}
    </AuthProvider>
  );
}
