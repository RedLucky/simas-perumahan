import * as React from "react";

export function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-zinc-600">{subtitle}</p> : null}
    </div>
  );
}
