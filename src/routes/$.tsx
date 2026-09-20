import { createFileRoute, notFound } from "@tanstack/react-router";
import { PageSections } from "@/components/site/PageSections";
import { fetchPage } from "@/lib/site-content";

export const Route = createFileRoute("/$")({
  loader: async ({ params }) => {
    const path = `/${params._splat ?? ""}`;
    const page = await fetchPage(path);
    if (!page || !page.is_published || page.page_kind !== "content") throw notFound();
    return page;
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [
      { title: loaderData.meta_title },
      { name: "description", content: loaderData.meta_description },
      { property: "og:title", content: loaderData.meta_title },
      { property: "og:description", content: loaderData.meta_description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ] : [{ title: "Page not found | Straight Line Printing" }, { name: "robots", content: "noindex" }],
  }),
  component: ManagedContentPage,
});

function ManagedContentPage() {
  const page = Route.useLoaderData();
  return <PageSections slug={page.path} />;
}