import type { ReactNode } from "react";
import { Copy } from "@/lib/site-copy";

export function PageHero({
  eyebrow,
  title,
  description,
  copyId,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  /** When set, the wording becomes editable by staff (layout stays fixed). */
  copyId?: string;
  children?: ReactNode;
}) {
  return (
    <section className="bg-ink text-ink-foreground">
      <div className="section-shell py-16 md:py-20">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            {copyId ? (
              <Copy id={`${copyId}.eyebrow`}>{eyebrow}</Copy>
            ) : (
              eyebrow
            )}
          </p>
        )}
        <h1 className="display-heading mt-3 text-5xl md:text-7xl">
          {copyId ? <Copy id={`${copyId}.title`}>{title}</Copy> : title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-base opacity-75 md:text-lg">
            {copyId ? <Copy id={`${copyId}.description`}>{description}</Copy> : description}
          </p>
        )}
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
      <div className="hazard-rule" />
    </section>
  );
}

export function Section({
  title,
  description,
  copyId,
  children,
}: {
  title?: string;
  description?: string;
  copyId?: string;
  children: ReactNode;
}) {
  return (
    <section className="section-shell py-14">
      {title && (
        <h2 className="display-heading text-3xl md:text-4xl">
          {copyId ? <Copy id={`${copyId}.title`}>{title}</Copy> : title}
        </h2>
      )}
      {description && (
        <p className="mt-3 max-w-2xl text-muted-foreground">
          {copyId ? <Copy id={`${copyId}.description`}>{description}</Copy> : description}
        </p>
      )}
      <div className={title ? "mt-8" : ""}>{children}</div>
    </section>
  );
}
