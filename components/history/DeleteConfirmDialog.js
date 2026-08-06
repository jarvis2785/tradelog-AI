"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2, TriangleAlert } from "lucide-react";

export default function DeleteConfirmDialog({ trade, onCancel, onConfirm, deleting }) {
  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={deleting ? undefined : onCancel}
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
            <div className="w-10 h-10 rounded-full bg-loss/10 flex items-center justify-center shrink-0">
              <TriangleAlert size={18} className="text-loss" />
            </div>
            <div>
              <h3 className="text-h3 text-text-primary">Delete trade?</h3>
              <p className="text-body text-text-secondary mt-1">
                Are you sure you want to delete{" "}
                {trade?.stock_name ? <span className="text-text-primary">{trade.stock_name}</span> : "this trade"}?
                This cannot be undone.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              disabled={deleting}
              className="btn-secondary flex-1 h-11"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={deleting}
              className="flex-1 h-11 inline-flex items-center justify-center gap-2 bg-loss hover:bg-loss/85 text-white font-medium rounded-control transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {deleting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Trade"
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
