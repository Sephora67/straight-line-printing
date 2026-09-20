import { useState } from "react";
import { Check, Clock, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { SiteSection } from "@/lib/site-content";
import {
  AddItemButton,
  EditableImage,
  EditableText,
  EditableVideo,
  LinkTargetEditor,
  RemoveItemButton,
  useList,
  useSection,
  useValue,
} from "@/components/site/editor/SiteEditor";
import {
  ButtonStyleEditor,
  buttonClasses,
  buttonSize,
  buttonVariant,
  type LinkItem,
} from "@/components/site/editor/ButtonStyle";
import { Subsections } from "@/components/site/sections/Subsections";

function ButtonRow({ path }: { path: (string | number)[] }) {
  const { items, add, remove, editing } = useList<LinkItem>(path, []);
  if (!editing && items.length === 0) return null;
  return (
    <div className="mt-8 flex flex-wrap items-start gap-3">
      {items.map((item, i) => (
        <div key={i} className="relative">
          {editing && <RemoveItemButton onClick={() => remove(i)} />}
          <Button
            asChild
            size={buttonSize(item)}
            variant={buttonVariant(item, i === 0 ? "default" : "outline")}
            className={buttonClasses(item)}
          >
            <a href={editing ? undefined : item.to || "#"}>
              <EditableText path={[...path, i, "label"]} placeholder="Button label" />
            </a>
          </Button>
          {editing && <ButtonStyleEditor path={[...path, i]} />}
        </div>
      ))}
      {editing && (
        <AddItemButton
          label="Add button"
          onClick={() => add({ label: "New button", to: "/contact" })}
        />
      )}
    </div>
  );
}


function SectionHeading({
  titlePath = ["title"],
  descriptionPath = ["description"],
  light,
}: {
  titlePath?: (string | number)[];
  descriptionPath?: (string | number)[];
  light?: boolean;
}) {
  const { editing } = useSection();
  const title = useValue<string>(titlePath, "");
  const description = useValue<string>(descriptionPath, "");
  if (!editing && !title && !description) return null;
  return (
    <>
      {(editing || title) && (
        <EditableText
          as="h2"
          path={titlePath}
          placeholder="Section title"
          className="display-heading block text-3xl md:text-4xl"
        />
      )}
      {(editing || description) && (
        <EditableText
          as="p"
          path={descriptionPath}
          placeholder="Optional supporting sentence"
          className={cn("mt-3 block max-w-2xl", light ? "opacity-75" : "text-muted-foreground")}
        />
      )}
    </>
  );
}

/* ---------------- shared editing controls ---------------- */

function OptionRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center gap-2 rounded border border-dashed border-border bg-background/80 p-2 text-foreground">
      <span className="px-1 text-[10px] uppercase tracking-widest text-muted-foreground">Layout</span>
      {children}
    </div>
  );
}

function OptionToggle({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Button type="button" size="sm" variant={active ? "default" : "outline"} onClick={onClick}>
      {label}
    </Button>
  );
}

/* ---------------- individual sections ---------------- */


function Hero() {
  const dark = useValue<boolean>(["dark"], true);
  const large = useValue<string>(["size"], "") === "large";
  return (
    <section
      className={cn("relative overflow-hidden", dark ? "bg-ink text-ink-foreground" : "bg-background")}
    >
      <div className="absolute inset-0">
        <EditableImage
          path={["image", "url"]}
          altPath={["image", "alt"]}
          className="size-full"
          imgClassName="size-full object-cover opacity-40"
          placeholderLabel="Add a background image"
          editClassName="top-14"
        />
      </div>
      <div className={cn("section-shell relative", large ? "py-24 md:py-36" : "py-16 md:py-20")}>
        <EditableText
          path={["eyebrow"]}
          placeholder="Eyebrow"
          className="block text-xs font-bold uppercase tracking-[0.3em] text-primary"
        />
        <EditableText
          as="h1"
          path={["title"]}
          placeholder="Headline"
          className={cn(
            "display-heading mt-4 block max-w-4xl",
            large ? "text-6xl md:text-8xl" : "text-5xl md:text-7xl",
          )}
        />
        <EditableText
          as="p"
          path={["description"]}
          placeholder="Supporting sentence"
          multiline
          className={cn("mt-5 block max-w-2xl text-base md:text-lg", dark ? "opacity-80" : "text-muted-foreground")}
        />
        <ButtonRow path={["buttons"]} />
      </div>
      <div className="hazard-rule relative" />
    </section>
  );
}

function RichText() {
  return (
    <section className="section-shell py-14">
      <SectionHeading />
      <EditableText
        as="div"
        path={["body"]}
        multiline
        placeholder="Write your text here"
        className="mt-6 block max-w-3xl text-muted-foreground"
      />
    </section>
  );
}

type FeatureItem = {
  title: string;
  body: string;
  to?: string;
  buttonLabel?: string;
  image?: { url?: string; alt?: string };
};

function FeatureGrid() {
  const { items, add, remove, editing } = useList<FeatureItem>(["items"], []);
  const { update } = useSection();
  const dark = useValue<boolean>(["dark"], false);
  const centered = useValue<string>(["align"], "") === "center";
  const withMedia = useValue<boolean>(["showImages"], false);
  const columns = items.length === 2 ? 2 : 3;
  return (
    <section className={cn("py-14", dark ? "bg-ink text-ink-foreground" : "")}>
      <div className={cn("section-shell", centered && "text-center")}>
        {editing && (
          <OptionRow>
            <OptionToggle
              label="Photos"
              active={withMedia}
              onClick={() => update(["showImages"], !withMedia)}
            />
            <OptionToggle
              label="Dark band"
              active={dark}
              onClick={() => update(["dark"], !dark)}
            />
            <OptionToggle
              label="Centred"
              active={centered}
              onClick={() => update(["align"], centered ? "left" : "center")}
            />
          </OptionRow>
        )}
        <SectionHeading light={dark} />
        <div
          className={cn(
            "mt-8 grid gap-6 sm:grid-cols-2",
            columns === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3",
          )}
        >
          {items.map((item, i) => (
            <div
              key={i}
              className={cn(
                "relative p-6",
                withMedia ? "border-t-4 border-primary" : "border-l-4 border-primary",
                dark ? "bg-steel" : "bg-card",
                centered && "text-center",
              )}
            >
              {editing && <RemoveItemButton onClick={() => remove(i)} />}
              {item.to && !editing && !item.buttonLabel ? (
                <a href={item.to} className="absolute inset-0" aria-label={item.title} />
              ) : null}
              {withMedia && (
                <EditableImage
                  path={["items", i, "image", "url"]}
                  altPath={["items", i, "image", "alt"]}
                  className="relative mb-5 aspect-4/3 w-full overflow-hidden"
                  imgClassName="h-full w-full object-cover"
                  placeholderLabel="Add a photo"
                />
              )}
              <EditableText
                as="h3"
                path={["items", i, "title"]}
                placeholder="Card title"
                className="display-heading relative block text-2xl"
              />
              <EditableText
                as="p"
                path={["items", i, "body"]}
                placeholder="Card description"
                className={cn(
                  "relative mt-2 block text-sm",
                  dark ? "opacity-75" : "text-muted-foreground",
                )}
              />
              {item.buttonLabel ? (
                <div className={cn("relative mt-5", centered && "flex justify-center")}>
                  <Button
                    asChild
                    size={buttonSize(item as unknown as LinkItem)}
                    className={buttonClasses(item as unknown as LinkItem)}
                  >
                    <a href={editing ? undefined : item.to || "#"}>
                      <EditableText path={["items", i, "buttonLabel"]} placeholder="Button label" />
                    </a>
                  </Button>
                  {editing && <ButtonStyleEditor path={["items", i]} />}
                </div>
              ) : (
                editing && (
                  <div className="relative mt-4">
                    <AddItemButton
                      label="Add button"
                      onClick={() => update(["items", i, "buttonLabel"], "Learn more")}
                    />
                  </div>
                )
              )}
              {editing && <LinkTargetEditor path={["items", i, "to"]} />}
            </div>
          ))}
        </div>
        {editing && (
          <AddItemButton
            label="Add card"
            onClick={() => add({ title: "New card", body: "Describe it." })}
          />
        )}
      </div>
    </section>
  );
}


function Steps() {
  const { items, add, remove, editing } = useList<{ title: string; body: string }>(["items"], []);
  const soft = useValue<string>(["tone"], "") === "soft";
  return (
    <section className={cn(soft ? "bg-secondary py-14" : "py-14")}>
      <div className="section-shell">
        <SectionHeading />
        <ol className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((_, i) => (
            <li key={i} className="relative border-t-4 border-primary bg-card p-5">
              {editing && <RemoveItemButton onClick={() => remove(i)} />}
              <span className="display-heading text-4xl text-primary">
                {String(i + 1).padStart(2, "0")}
              </span>
              <EditableText
                as="h3"
                path={["items", i, "title"]}
                placeholder="Step title"
                className="mt-2 block font-bold uppercase tracking-wide"
              />
              <EditableText
                as="p"
                path={["items", i, "body"]}
                placeholder="Step description"
                className="mt-2 block text-sm text-muted-foreground"
              />
            </li>
          ))}
        </ol>
        {editing && (
          <AddItemButton label="Add step" onClick={() => add({ title: "New step", body: "Describe it." })} />
        )}
      </div>
    </section>
  );
}

function Checklist() {
  const { items, add, remove, editing } = useList<string>(["items"], []);
  return (
    <section className="section-shell py-14">
      <SectionHeading />
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {items.map((_, i) => (
          <li key={i} className="relative flex items-start gap-3 rounded border border-border bg-card p-4">
            {editing && <RemoveItemButton onClick={() => remove(i)} />}
            <Check className="mt-0.5 size-5 shrink-0 text-primary" />
            <EditableText path={["items", i]} placeholder="List item" className="block text-sm" />
          </li>
        ))}
      </ul>
      {editing && <AddItemButton label="Add item" onClick={() => add("New item")} />}
    </section>
  );
}

function SpecList() {
  const { items, add, remove, editing } = useList<{ label: string; value: string }>(["items"], []);
  return (
    <section className="section-shell py-14">
      <SectionHeading />
      <dl className="mt-8 grid gap-px overflow-hidden rounded border border-border bg-border sm:grid-cols-2">
        {items.map((_, i) => (
          <div key={i} className="relative bg-card p-4">
            {editing && <RemoveItemButton onClick={() => remove(i)} />}
            <EditableText
              as="dt"
              path={["items", i, "label"]}
              placeholder="Label"
              className="block text-xs font-bold uppercase tracking-widest text-muted-foreground"
            />
            <EditableText
              as="dd"
              path={["items", i, "value"]}
              placeholder="Value"
              className="mt-1 block text-sm"
            />
          </div>
        ))}
      </dl>
      {editing && (
        <AddItemButton label="Add spec" onClick={() => add({ label: "Label", value: "Value" })} />
      )}
    </section>
  );
}

function ImageText() {
  const { update } = useSection();
  const dark = useValue<boolean>(["dark"], false);
  const side = useValue<string>(["imageSide"], "right");
  const mediaKind = useValue<string>(["mediaKind"], "image");
  const isVideo = mediaKind === "video";
  const { items: bullets, add, remove, editing } = useList<{ title: string; body: string }>(
    ["bullets"],
    [],
  );
  return (
    <section className={cn("py-16", dark ? "bg-ink text-ink-foreground" : "")}>
      <div className="section-shell">
        {editing && (
          <OptionRow>
            <OptionToggle
              label="Image"
              active={!isVideo}
              onClick={() => update(["mediaKind"], "image")}
            />
            <OptionToggle
              label="Video"
              active={isVideo}
              onClick={() => update(["mediaKind"], "video")}
            />
            <span className="mx-1 h-5 w-px bg-border" />
            <OptionToggle
              label="Media left"
              active={side === "left"}
              onClick={() => update(["imageSide"], "left")}
            />
            <OptionToggle
              label="Media right"
              active={side !== "left"}
              onClick={() => update(["imageSide"], "right")}
            />
            <OptionToggle
              label="Dark band"
              active={dark}
              onClick={() => update(["dark"], !dark)}
            />
          </OptionRow>
        )}
      </div>
      <div
        className={cn(
          "section-shell grid gap-10 md:grid-cols-2 md:items-center",
          side === "left" && "md:[&>*:first-child]:order-2",
        )}
      >
        <div>
          <EditableText
            as="h2"
            path={["title"]}
            placeholder="Section title"
            className="display-heading block text-4xl md:text-5xl"
          />
          <EditableText
            as="p"
            path={["body"]}
            multiline
            placeholder="Describe this section"
            className={cn("mt-4 block", dark ? "opacity-75" : "text-muted-foreground")}
          />
          <ButtonRow path={["buttons"]} />
        </div>
        <div>
          {isVideo ? (
            <EditableVideo path={["video", "url"]} />
          ) : (
            <EditableImage
              path={["image", "url"]}
              altPath={["image", "alt"]}
              className="w-full"
              imgClassName="w-full object-cover"
              placeholderLabel="Add an image"
            />
          )}

          {(editing || bullets.length > 0) && (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              {bullets.map((_, i) => (
                <li
                  key={i}
                  className={cn(
                    "relative border-l-4 border-primary p-4",
                    dark ? "bg-steel" : "bg-secondary",
                  )}
                >
                  {editing && <RemoveItemButton onClick={() => remove(i)} />}
                  <EditableText
                    as="h3"
                    path={["bullets", i, "title"]}
                    placeholder="Point title"
                    className="block font-bold uppercase tracking-wide"
                  />
                  <EditableText
                    as="p"
                    path={["bullets", i, "body"]}
                    placeholder="Point description"
                    className={cn("mt-1 block text-sm", dark ? "opacity-75" : "text-muted-foreground")}
                  />
                </li>
              ))}
            </ul>
          )}
          {editing && (
            <AddItemButton
              label="Add point"
              onClick={() => add({ title: "New point", body: "Describe it." })}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function Gallery() {
  const { items, add, remove, editing } = useList<{ url: string; alt: string }>(["items"], []);
  return (
    <section className="section-shell py-14">
      <SectionHeading />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((_, i) => (
          <div key={i} className="relative">
            {editing && <RemoveItemButton onClick={() => remove(i)} />}
            <EditableImage
              path={["items", i, "url"]}
              altPath={["items", i, "alt"]}
              className="aspect-4/3 w-full overflow-hidden border border-border"
            />
          </div>
        ))}
      </div>
      {editing && <AddItemButton label="Add image" onClick={() => add({ url: "", alt: "" })} />}
    </section>
  );
}

function VideoSection() {
  return (
    <section className="section-shell py-14">
      <SectionHeading />
      <div className="mt-8 max-w-3xl">
        <EditableVideo path={["url"]} />
        <EditableText
          as="p"
          path={["caption"]}
          placeholder="Optional caption"
          className="mt-3 block text-sm text-muted-foreground"
        />
      </div>
    </section>
  );
}

function FaqSection() {
  const { items, add, remove, editing } = useList<{ q: string; a: string }>(["items"], []);
  return (
    <section className="section-shell py-14">
      <SectionHeading />
      {editing ? (
        <div className="mt-8 grid max-w-3xl gap-4">
          {items.map((_, i) => (
            <div key={i} className="relative border border-border bg-card p-4">
              <RemoveItemButton onClick={() => remove(i)} />
              <EditableText
                path={["items", i, "q"]}
                placeholder="Question"
                className="block font-semibold"
              />
              <EditableText
                path={["items", i, "a"]}
                multiline
                placeholder="Answer"
                className="mt-2 block text-sm text-muted-foreground"
              />
            </div>
          ))}
          <AddItemButton
            label="Add question"
            onClick={() => add({ q: "New question?", a: "The answer." })}
          />
        </div>
      ) : (
        <Accordion type="single" collapsible className="mt-8 max-w-3xl">
          {items.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left font-semibold">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </section>
  );
}

function Testimonials() {
  const { items, add, remove, editing } = useList<{ quote: string; name: string; role: string }>(
    ["items"],
    [],
  );
  return (
    <section className="bg-secondary py-14">
      <div className="section-shell">
        <SectionHeading />
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {items.map((_, i) => (
            <figure key={i} className="relative border-l-4 border-primary bg-card p-6">
              {editing && <RemoveItemButton onClick={() => remove(i)} />}
              <EditableText
                as="div"
                path={["items", i, "quote"]}
                multiline
                placeholder="What they said"
                className="block text-sm"
              />
              <figcaption className="mt-4 text-xs uppercase tracking-widest text-muted-foreground">
                <EditableText path={["items", i, "name"]} placeholder="Name" className="font-bold" />
                {" · "}
                <EditableText path={["items", i, "role"]} placeholder="Company" />
              </figcaption>
            </figure>
          ))}
        </div>
        {editing && (
          <AddItemButton
            label="Add testimonial"
            onClick={() => add({ quote: "Great work.", name: "Customer", role: "Company" })}
          />
        )}
      </div>
    </section>
  );
}

function Cta() {
  const dark = useValue<boolean>(["dark"], false);
  return (
    <section className={cn("py-16", dark ? "bg-ink text-ink-foreground" : "")}>
      <div className="section-shell text-center">
        <EditableText
          as="h2"
          path={["title"]}
          placeholder="Call to action"
          className="display-heading block text-4xl md:text-5xl"
        />
        <EditableText
          as="p"
          path={["body"]}
          multiline
          placeholder="Supporting sentence"
          className={cn("mx-auto mt-4 block max-w-xl", dark ? "opacity-75" : "text-muted-foreground")}
        />
        <div className="flex justify-center">
          <ButtonRow path={["buttons"]} />
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  type Plan = {
    name: string;
    price: string;
    period: string;
    features: string[];
    button: LinkItem;
    highlight?: boolean;
  };
  const { items, add, remove, editing } = useList<Plan>(["items"], []);
  return (
    <section className="section-shell py-14">
      <SectionHeading />
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {items.map((plan, i) => (
          <div
            key={i}
            className={cn(
              "relative border bg-card p-6",
              plan.highlight ? "border-primary border-t-4" : "border-border",
            )}
          >
            {editing && <RemoveItemButton onClick={() => remove(i)} />}
            <EditableText
              as="h3"
              path={["items", i, "name"]}
              placeholder="Plan name"
              className="display-heading block text-2xl"
            />
            <div className="mt-3 flex items-baseline gap-2">
              <EditableText
                path={["items", i, "price"]}
                placeholder="$0"
                className="display-heading text-4xl text-primary"
              />
              <EditableText
                path={["items", i, "period"]}
                placeholder="per piece"
                className="text-xs uppercase tracking-widest text-muted-foreground"
              />
            </div>
            <ul className="mt-5 space-y-2">
              {(plan.features ?? []).map((_, f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                  <EditableText path={["items", i, "features", f]} placeholder="Feature" />
                </li>
              ))}
            </ul>
            <Button
              asChild
              variant={buttonVariant(plan.button, "default")}
              size={buttonSize(plan.button)}
              className={cn("mt-6 w-full", buttonClasses(plan.button))}
            >
              <a href={editing ? undefined : plan.button?.to || "#"}>
                <EditableText path={["items", i, "button", "label"]} placeholder="Choose" />
              </a>
            </Button>
            {editing && <ButtonStyleEditor path={["items", i, "button"]} />}

          </div>
        ))}
      </div>
      {editing && (
        <AddItemButton
          label="Add plan"
          onClick={() =>
            add({
              name: "New plan",
              price: "$0",
              period: "per piece",
              features: ["Feature one"],
              button: { label: "Get started", to: "/quote-request" },
            })
          }
        />
      )}
    </section>
  );
}

function LogoStrip() {
  const { items, add, remove, editing } = useList<{ url: string; alt: string }>(["items"], []);
  return (
    <section className="section-shell py-10">
      <SectionHeading />
      <div className="mt-6 flex flex-wrap items-center gap-8">
        {items.map((_, i) => (
          <div key={i} className="relative h-12 w-32">
            {editing && <RemoveItemButton onClick={() => remove(i)} />}
            <EditableImage
              path={["items", i, "url"]}
              altPath={["items", i, "alt"]}
              className="h-12 w-32"
              imgClassName="h-12 w-32 object-contain"
              placeholderLabel="Logo"
            />
          </div>
        ))}
      </div>
      {editing && <AddItemButton label="Add logo" onClick={() => add({ url: "", alt: "Logo" })} />}
    </section>
  );
}

function ContactInfo() {
  const icons = { mail: Mail, phone: Phone, map: MapPin, clock: Clock } as const;
  const { items, add, remove, editing } = useList<{ icon: string; label: string; value: string }>(
    ["items"],
    [],
  );
  return (
    <section className="section-shell py-14">
      <SectionHeading />
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {items.map((item, i) => {
          const Icon = icons[(item.icon as keyof typeof icons) ?? "mail"] ?? Mail;
          return (
            <div key={i} className="relative flex gap-4 border border-border bg-card p-5">
              {editing && <RemoveItemButton onClick={() => remove(i)} />}
              <Icon className="size-5 shrink-0 text-primary" />
              <div>
                <EditableText
                  as="h3"
                  path={["items", i, "label"]}
                  placeholder="Label"
                  className="block text-xs font-bold uppercase tracking-widest text-muted-foreground"
                />
                <EditableText
                  as="p"
                  path={["items", i, "value"]}
                  placeholder="Details"
                  className="mt-1 block text-sm"
                />
              </div>
            </div>
          );
        })}
      </div>
      {editing && (
        <AddItemButton
          label="Add detail"
          onClick={() => add({ icon: "mail", label: "Label", value: "Details" })}
        />
      )}
    </section>
  );
}

function ContactForm({ pageSlug }: { pageSlug: string }) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  return (
    <section className="section-shell py-14">
      <div className="max-w-2xl">
        <SectionHeading descriptionPath={["body"]} />
        {sent ? (
          <p className="mt-6 border-l-4 border-primary bg-secondary p-5 text-sm">
            Thanks — your message is in. We'll get back to you shortly.
          </p>
        ) : (
          <form
            className="mt-6 grid gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const fd = new FormData(form);
              setBusy(true);
              const { error } = await supabase.from("site_messages").insert({
                name: String(fd.get("name") ?? ""),
                email: String(fd.get("email") ?? ""),
                phone: String(fd.get("phone") ?? "") || null,
                message: String(fd.get("message") ?? ""),
                page_slug: pageSlug,
              });
              setBusy(false);
              if (error) {
                toast.error(error.message);
                return;
              }
              setSent(true);
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="name" required placeholder="Your name" />
              <Input name="email" type="email" required placeholder="Email address" />
            </div>
            <Input name="phone" placeholder="Phone (optional)" />
            <Textarea name="message" required rows={5} placeholder="What can we help with?" />
            <Button type="submit" size="lg" disabled={busy} className="justify-self-start">
              {busy ? "Sending…" : "Send message"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

function LinkRow() {
  const { items, add, remove, editing } = useList<LinkItem>(["items"], []);
  return (
    <section className="section-shell py-14">
      <SectionHeading />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, i) => (
          <div key={i} className="relative">
            {editing && <RemoveItemButton onClick={() => remove(i)} />}
            <Button
              asChild
              variant={buttonVariant(item, "outline")}
              size={buttonSize(item)}
              className={cn("w-full justify-start", buttonClasses(item))}
            >
              <a href={editing ? undefined : item.to || "#"}>
                <EditableText path={["items", i, "label"]} placeholder="Link label" />
              </a>
            </Button>
            {editing && <ButtonStyleEditor path={["items", i]} />}

          </div>
        ))}
      </div>
      {editing && (
        <AddItemButton label="Add link" onClick={() => add({ label: "New link", to: "/shop" })} />
      )}
    </section>
  );
}

function TableSection() {
  const { content, update, editing } = useSection();
  const columns = (content["columns"] as string[]) ?? [];
  const rows = (content["rows"] as string[][]) ?? [];
  return (
    <section className="section-shell py-14">
      <SectionHeading />
      <div className="mt-8 overflow-x-auto border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-xs uppercase tracking-widest">
            <tr>
              {columns.map((_, c) => (
                <th key={c} className="px-4 py-3 text-left font-bold">
                  <EditableText path={["columns", c]} placeholder="Column" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className="border-t border-border">
                {columns.map((_, c) => (
                  <td key={c} className="px-4 py-3">
                    <EditableText path={["rows", r, c]} placeholder="—" />
                  </td>
                ))}
                {editing && (
                  <td className="px-2">
                    <button
                      type="button"
                      className="text-xs text-destructive"
                      onClick={() => update(["rows"], rows.filter((_, i) => i !== r))}
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EditableText
        as="p"
        path={["note"]}
        placeholder="Optional note"
        className="mt-3 block text-xs text-muted-foreground"
      />
      {editing && (
        <div className="flex gap-2">
          <AddItemButton
            label="Add row"
            onClick={() => update(["rows"], [...rows, columns.map(() => "")])}
          />
          <AddItemButton
            label="Add column"
            onClick={() => {
              update(["columns"], [...columns, "Column"]);
              update(["rows"], rows.map((row) => [...row, ""]));
            }}
          />
        </div>
      )}
    </section>
  );
}

export function SectionView({ section }: { section: SiteSection }) {
  return (
    <>
      <SectionBody section={section} />
      <Subsections />
    </>
  );
}

function SectionBody({ section }: { section: SiteSection }) {
  switch (section.type) {
    case "hero":
      return <Hero />;
    case "rich_text":
      return <RichText />;
    case "feature_grid":
      return <FeatureGrid />;
    case "steps":
      return <Steps />;
    case "checklist":
      return <Checklist />;
    case "spec_list":
      return <SpecList />;
    case "image_text":
      return <ImageText />;
    case "gallery":
      return <Gallery />;
    case "video":
      return <VideoSection />;
    case "faq":
      return <FaqSection />;
    case "testimonials":
      return <Testimonials />;
    case "cta":
      return <Cta />;
    case "pricing":
      return <Pricing />;
    case "logo_strip":
      return <LogoStrip />;
    case "contact_info":
      return <ContactInfo />;
    case "contact_form":
      return <ContactForm pageSlug={section.page_slug} />;
    case "link_row":
      return <LinkRow />;
    case "table":
      return <TableSection />;
    default:
      return null;
  }
}
