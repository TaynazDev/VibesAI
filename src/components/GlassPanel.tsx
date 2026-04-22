import { PropsWithChildren } from "react";

type GlassPanelProps = PropsWithChildren<{
  title?: string;
  className?: string;
}>;

export function GlassPanel({ title, className, children }: GlassPanelProps) {
  return (
    <section className={`glass panel ${className ?? ""}`.trim()}>
      {title ? <h2 className="panel-title">{title}</h2> : null}
      {children}
    </section>
  );
}
