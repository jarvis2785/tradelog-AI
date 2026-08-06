"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { setSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password) {
      setError("Enter your password");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Incorrect password");
        setLoading(false);
        return;
      }
      setSession();
      router.replace("/");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-dvh w-full flex items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-[400px] card"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center mb-5 shadow-[0_0_0_1px_rgba(99,102,241,0.4),0_8px_24px_-8px_rgba(99,102,241,0.6)]">
            <span className="text-white font-bold text-xl tracking-tight">TL</span>
          </div>
          <h1 className="text-h1 text-text-primary">TradeLog AI</h1>
          <p className="text-body text-text-secondary mt-2">
            Your personal trading intelligence
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              placeholder="Password"
              autoFocus
              className={`input-field pr-11 h-[46px] ${
                error ? "border-loss focus:border-loss" : ""
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-small text-loss -mt-2"
            >
              {error}
            </motion.p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-[46px] mt-2"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              "Log In"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
