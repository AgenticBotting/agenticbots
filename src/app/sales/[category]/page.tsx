import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryPage } from "@/components/marketing";
import { getCategory, getPillar } from "@/lib/catalog";

type Params = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return getPillar("sales")!.categories.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { category: slug } = await params;
  const category = getCategory("sales", slug);
  if (!category) return {};
  return {
    title: `${category.name} — ${category.botName}`,
    description: category.blurb,
    alternates: { canonical: `/sales/${category.slug}` },
  };
}

export default async function Page({ params }: Params) {
  const { category: slug } = await params;
  const category = getCategory("sales", slug);
  if (!category) notFound();
  return <CategoryPage category={category} />;
}
