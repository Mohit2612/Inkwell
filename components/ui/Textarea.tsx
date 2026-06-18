import { forwardRef, TextareaHTMLAttributes } from "react";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className = "", ...props }, ref) => (
  <textarea
    ref={ref}
    className={[
      "w-full resize-y rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink",
      "outline-none transition placeholder:text-slate-400",
      "focus:border-primary focus:ring-2 focus:ring-primary/20",
      "disabled:cursor-not-allowed disabled:bg-surface",
      className,
    ].join(" ")}
    {...props}
  />
));

Textarea.displayName = "Textarea";
