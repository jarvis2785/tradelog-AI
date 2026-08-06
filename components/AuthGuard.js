"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { hasSession } from "@/lib/auth";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!hasSession()) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [router]);

  if (!checked) {
    return <div className="min-h-dvh w-full bg-background" />;
  }

  return children;
}
