type Variant = "default" | "primary" | "accent" | "warning" | "danger";

const variants: Record<Variant, string> = {
  default: "bg-surface text-slate-600 border border-border",
  primary: "bg-primary/10 text-primary",
  accent:  "bg-accent-soft text-accent",
  warning: "bg-amber-50 text-amber-700",
  danger:  "bg-red-50 text-red-600",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
