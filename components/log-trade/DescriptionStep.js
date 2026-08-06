"use client";

import { Loader2 } from "lucide-react";

export default function DescriptionStep({ description, onChange, onSubmit, saving }) {
  return (
    <div className="card">
      <h2 className="text-h2 text-text-primary mb-1">What happened today?</h2>
      <p className="text-body text-text-secondary mb-5">
        Describe your trade honestly — this is what makes your weekly report powerful.
      </p>

      <textarea
        value={description}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe your trade. Did you follow your setup? Any mistakes? Be honest — this is what makes your weekly report powerful."
        className="input-field min-h-[150px] resize-y leading-relaxed"
        disabled={saving}
      />
      <p className="text-small text-text-muted mt-2">{description.length} characters</p>

      <button
        onClick={onSubmit}
        disabled={saving || description.trim().length === 0}
        className="btn-primary w-full h-12 mt-5"
      >
        {saving ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            AI is analysing your trade...
          </>
        ) : (
          "Analyse & Save Trade"
        )}
      </button>
    </div>
  );
}
