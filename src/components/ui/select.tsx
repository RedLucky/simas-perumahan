import * as React from "react";
import { cn } from "@/lib/cn";

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none ring-zinc-300 transition focus:ring-2",
        className,
      )}
      {...props}
    />
  );
}
