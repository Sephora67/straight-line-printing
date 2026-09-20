import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHero, Section } from "@/components/site/PageHero";

export type ServiceStep = { title: string; body: string };

export function ServicePage({
  eyebrow,
  title,
  description,
  highlights,
  steps,
  specs,
}: {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  steps: ServiceStep[];
  specs: { label: string; value: string }[];
}) {
  return (
    <>
      <PageHero eyebrow={eyebrow} title={title} description={description}>
        <Button asChild size="lg">
          <Link to="/quote-request">Request a Quote</Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="border-ink-foreground/30 bg-transparent text-ink-foreground hover:bg-steel">
          <Link to="/design-studio">Open Design Studio</Link>
        </Button>
      </PageHero>

      <Section title="What you get">
        <ul className="grid gap-3 sm:grid-cols-2">
          {highlights.map((h) => (
            <li key={h} className="flex items-start gap-3 rounded border border-border bg-card p-4">
              <Check className="mt-0.5 size-5 shrink-0 text-primary" />
              <span className="text-sm">{h}</span>
            </li>
          ))}
        </ul>
      </Section>

      <section className="bg-secondary py-14">
        <div className="section-shell">
          <h2 className="display-heading text-3xl md:text-4xl">How this job runs</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-4">
            {steps.map((s, i) => (
              <li key={s.title} className="border-t-4 border-primary bg-card p-5">
                <span className="display-heading text-4xl text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-2 font-bold uppercase tracking-wide">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Section title="Specs & options">
        <dl className="grid gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2">
          {specs.map((s) => (
            <div key={s.label} className="bg-card p-4">
              <dt className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {s.label}
              </dt>
              <dd className="mt-1 text-sm">{s.value}</dd>
            </div>
          ))}
        </dl>
      </Section>
    </>
  );
}
