import { ArticleComposer } from "@/components/article/article-composer";
import { Card } from "@/components/ui/card";
import { HomeButton } from "@/components/navigation/home-button";
import { NotificationBell } from "@/components/navigation/notification-bell";
import { requireUser } from "@/lib/session";
import { getCurrentLocale, getDictionary, translate } from "@/lib/i18n/server";

export default async function NewArticlePage() {
  await requireUser();
  const locale = await getCurrentLocale();
  const dictionary = getDictionary(locale);
  const t = (path: string) => translate(dictionary, path);
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-16">
      <div className="flex items-center justify-between">
        <HomeButton expanded />
        <NotificationBell />
      </div>
      <header className="space-y-3 text-white">
        <h1 className="text-4xl font-semibold">{t("newArticlePage.title")}</h1>
        <p className="text-slate-300">{t("newArticlePage.subtitle")}</p>
      </header>
      <Card className="border-white/5 bg-white/10">
        <ArticleComposer />
      </Card>
    </main>
  );
}
