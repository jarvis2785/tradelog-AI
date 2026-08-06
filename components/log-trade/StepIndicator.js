import { classNames } from "@/lib/utils";

const STEPS = ["Upload", "Review", "Describe"];

export default function StepIndicator({ step }) {
  return (
    <div className="mb-6">
      <p className="text-small text-text-muted mb-3">
        Step {step} of 3 — {STEPS[step - 1]}
      </p>
      <div className="flex items-center gap-2">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={classNames(
              "h-1 flex-1 rounded-full transition-colors duration-300",
              s <= step ? "bg-accent" : "bg-border"
            )}
          />
        ))}
      </div>
    </div>
  );
}
