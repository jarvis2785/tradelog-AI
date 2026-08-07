import Link from "next/link";

export default function EmptyState({ icon: Icon, title, subtitle, actionLabel, actionHref }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-overlay/[0.04] border border-border flex items-center justify-center mb-4">
          <Icon size={24} className="text-text-muted" />
        </div>
      )}
      <p className="text-body text-text-secondary max-w-xs">{title}</p>
      {subtitle && (
        <p className="text-small text-text-muted mt-1 max-w-xs">{subtitle}</p>
      )}
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary mt-5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
