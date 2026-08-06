"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";

export default function RegenerateConfirmDialog({ onCancel, onConfirm, regenerating }) {
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={regenerating ? undefined : onCancel}
      >
        <motion.div
          key="dialog"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="bg-surface border border-border-hover rounded-t-card sm:rounded-card w-full sm:max-w-sm p-5"
        >
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
              <RefreshCw size={18} className="text-accent" />
            </div>
            <div>
              <h3 className="text-h3 text-text-primary">Regenerate report?</h3>
              <p className="text-body text-text-secondary mt-1">
                This will overwrite the existing report for this week with the latest trade
                data. Continue?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              disabled={regenerating}
              className="btn-secondary flex-1 h-11"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={regenerating}
              className="btn-primary flex-1 h-11"
            >
              {regenerating ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Regenerating...
                </>
              ) : (
                "Regenerate"
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
