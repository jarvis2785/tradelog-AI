"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const show = useCallback(
    (message, type = "info", duration = 4000) => {
      const id = ++idCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      timers.current[id] = setTimeout(() => dismiss(id), duration);
      return id;
    },
    [dismiss]
  );

  const api = {
    show,
    success: (msg, duration) => show(msg, "success", duration),
    error: (msg, duration) => show(msg, "error", duration),
    info: (msg, duration) => show(msg, "info", duration),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-sm">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`flex items-start gap-3 rounded-card border p-4 shadow-card backdrop-blur-sm ${
                t.type === "error"
                  ? "bg-loss/10 border-loss/30"
                  : t.type === "success"
                  ? "bg-profit/10 border-profit/30"
                  : "bg-surface border-border"
              }`}
            >
              {t.type === "error" && (
                <XCircle size={18} className="text-loss shrink-0 mt-0.5" />
              )}
              {t.type === "success" && (
                <CheckCircle2 size={18} className="text-profit shrink-0 mt-0.5" />
              )}
              {t.type === "info" && (
                <Info size={18} className="text-accent shrink-0 mt-0.5" />
              )}
              <p className="text-body text-text-primary flex-1">{t.message}</p>
              <button
                onClick={() => dismiss(t.id)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
