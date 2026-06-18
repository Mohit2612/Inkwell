"use client";

import { useEffect, useState } from "react";
import { Check, AlertCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface ToastProps {
  message: string;
  variant?: ToastVariant;
  duration?: number;
  onDismiss: () => void;
}

const icons: Record<ToastVariant, React.ReactNode> = {
  success: <Check className="h-4 w-4 text-accent" aria-hidden="true" />,
  error:   <AlertCircle className="h-4 w-4 text-red-500" aria-hidden="true" />,
  info:    <Info className="h-4 w-4 text-primary" aria-hidden="true" />,
};

export function Toast({
  message,
  variant = "success",
  duration = 3000,
  onDismiss,
}: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [duration, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink shadow-elevation-3"
    >
      {icons[variant]}
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="ml-2 rounded p-0.5 text-slate-400 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
        aria-label="Dismiss notification"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    variant?: ToastVariant;
  } | null>(null);

  const show = (message: string, variant?: ToastVariant) =>
    setToast({ message, variant });
  const hide = () => setToast(null);

  const node = toast ? (
    <Toast
      message={toast.message}
      variant={toast.variant}
      onDismiss={hide}
    />
  ) : null;

  return { show, hide, node };
}
