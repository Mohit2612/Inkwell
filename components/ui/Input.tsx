import { forwardRef, InputHTMLAttributes } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className = "", ...props }, ref) => (
  <input
    ref={ref}
    className={[
      "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink",
      "outline-none transition placeholder:text-slate-400",
      "focus:border-primary focus:ring-2 focus:ring-primary/20",
      "disabled:cursor-not-allowed disabled:bg-surface disabled:text-slate-400",
      "aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-1 aria-[invalid=true]:ring-red-400/30",
      className,
    ].join(" ")}
    {...props}
  />
));

Input.displayName = "Input";
