import { ArticleComposer } from "@/components/article/article-composer";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/lib/session";
import { getCurrentLocale, getDictionary, translate } from "@/lib/i18n/server";
import { SECTION_SLUGS, type SectionSlug } from "@/lib/sections";

interface NewArticlePageProps {
  searchParams: Promise<{ section?: string }>;
}

export default async function NewArticlePage(props: NewArticlePageProps) {
  await requireUser();
  const { section } = await props.searchParams;
  const normalizedSection = section && (SECTION_SLUGS as string[]).includes(section)
    ? (section as SectionSlug)
    : null;
  const locale = await getCurrentLocale();
  const dictionary = getDictionary(locale);
  const t = (path: string) => translate(dictionary, path);
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3 text-white">
        <h1 className="text-4xl font-semibold">{t("newArticlePage.title")}</h1>
        <p className="text-slate-300">{t("newArticlePage.subtitle")}</p>
      </header>
      <Card className="border-white/5 bg-white/10">
        <ArticleComposer initialSectionSlug={normalizedSection} />
      </Card>
    </main>
  );
}
