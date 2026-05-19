import * as React from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "outline" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-gradient-to-r from-[var(--app-accent)] to-[#3b82f6] text-white border-transparent shadow-md hover:shadow-lg hover:shadow-[var(--app-accent-glow)] hover:opacity-90",
  outline: "glass text-[var(--app-text)] border-[var(--app-border)] hover:bg-[var(--app-surface-2)]",
  ghost: "bg-transparent text-[var(--app-text)] border-transparent hover:bg-[var(--app-surface-2)]",
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
