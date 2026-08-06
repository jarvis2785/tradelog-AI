"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { classNames } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function UploadStep({
  previewUrl,
  onFileSelect,
  onExtract,
  onSkipToManual,
  extracting,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleFiles(fileList) {
    const file = fileList?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) return;
    onFileSelect(file);
  }

  return (
    <div className="card">
      <h2 className="text-h2 text-text-primary mb-1">Upload Trade Screenshot</h2>
      <p className="text-body text-text-secondary mb-5">
        Upload your Groww positions screenshot and let AI extract the trade data.
      </p>

      {!previewUrl ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={classNames(
            "flex flex-col items-center justify-center gap-3 h-[200px] rounded-card border-2 border-dashed cursor-pointer transition-colors duration-150 px-4 text-center",
            dragging
              ? "border-accent bg-accent/5"
              : "border-border hover:border-border-hover"
          )}
        >
          <div className="w-11 h-11 rounded-full bg-white/[0.04] flex items-center justify-center">
            <UploadCloud size={20} className="text-text-secondary" />
          </div>
          <p className="text-body text-text-secondary">
            Tap to upload or drag your Groww screenshot here
          </p>
          <p className="text-small text-text-muted">JPG, PNG or WEBP</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="relative rounded-card border border-border bg-black/40 overflow-hidden flex items-center justify-center min-h-[200px] max-h-[420px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Trade screenshot preview"
              className="max-h-[420px] w-auto object-contain"
            />
            {!extracting && (
              <button
                onClick={() => onFileSelect(null)}
                className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/70 border border-border-hover flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {extracting ? (
            <div className="flex flex-col gap-2.5">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-4 w-1/2" />
              <p className="text-small text-text-secondary flex items-center gap-2 mt-1">
                <Loader2 size={14} className="animate-spin" />
                Reading your screenshot...
              </p>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={onExtract} className="btn-primary flex-1 h-11">
                Extract Trade Data
              </button>
              <button
                onClick={onSkipToManual}
                className="btn-secondary h-11"
              >
                Enter Manually
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
