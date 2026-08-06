"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Share, X, Download } from "lucide-react";

const DISMISS_KEY = "tradelog_install_dismissed";

export default function InstallPrompt() {
  const [platform, setPlatform] = useState(null); // "ios" | "android" | null
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY)) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    if (isStandalone) return;

    const isIos = /iPad|iPhone|iPod/.test(window.navigator.userAgent) && !window.MSStream;
    if (isIos) {
      setPlatform("ios");
      setVisible(true);
      return;
    }

    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setDeferredPrompt(e);
      setPlatform("android");
      setVisible(true);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(DISMISS_KEY, "1");
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="fixed z-50 left-4 right-4 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:left-auto md:right-6 md:bottom-6 md:w-80"
        >
          <div className="bg-surface border border-border-hover rounded-card p-4 shadow-card-hover flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">TL</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body font-medium text-text-primary">Install TradeLog AI</p>
              {platform === "ios" ? (
                <p className="text-small text-text-secondary mt-1 leading-relaxed">
                  Tap <Share size={12} className="inline -mt-0.5" /> then &quot;Add to Home
                  Screen&quot; for the full app experience.
                </p>
              ) : (
                <p className="text-small text-text-secondary mt-1 leading-relaxed">
                  Add TradeLog AI to your home screen for quick access.
                </p>
              )}
              {platform === "android" && (
                <button
                  onClick={handleInstallClick}
                  className="btn-primary h-9 px-3.5 text-small mt-3"
                >
                  <Download size={14} />
                  Install
                </button>
              )}
            </div>
            <button
              onClick={dismiss}
              className="text-text-muted hover:text-text-primary transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
