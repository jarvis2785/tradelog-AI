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
          <div
            className="max-w-content mx-auto pt-[max(1rem,env(safe-area-inset-top))] md:pt-6 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:px-6 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-6"
          >
            {children}
          </div>
        </main>
        <BottomNav />
        <InstallPrompt />
      </div>
    </AuthGuard>
  );
}
