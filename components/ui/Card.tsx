import { HTMLAttributes } from "react";

export function Card({
  className = "",
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-border bg-white p-6 shadow-card ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
