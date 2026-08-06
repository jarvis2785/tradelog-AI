"use client";

import AuthGuard from "@/components/AuthGuard";
import { Sidebar, BottomNav } from "@/components/Nav";
import InstallPrompt from "@/components/InstallPrompt";

export default function AppLayout({ children }) {
  return (
    <AuthGuard>
      <div className="flex min-h-dvh w-full">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="max-w-content mx-auto px-4 md:px-6 py-4 md:py-6 pb-28 md:pb-6">
            {children}
          </div>
        </main>
        <BottomNav />
        <InstallPrompt />
      </div>
    </AuthGuard>
  );
}
