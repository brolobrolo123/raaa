import { getCurrentLocale, getDictionary, translate } from "@/lib/i18n/server";
import { requireUser } from "@/lib/session";
import { AvatarClient, type AvatarTab } from "@/components/avatar/avatar-client";

import "./avatar.css";

const DEFAULT_TAB: AvatarTab = "battle";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function AvatarPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const session = await requireUser();
  const role = session?.user?.role ?? "USER";
  const canAccessOwnerTabs = role === "OWNER";
  const locale = await getCurrentLocale();
  const dictionary = getDictionary(locale);
  const t = (path: string) => translate(dictionary, path);
  const resolvedSearchParams = (await searchParams) ?? {};
  const requestedTab = (() => {
    const raw = resolvedSearchParams?.tab;
    if (Array.isArray(raw)) return raw[0];
    return raw;
  })();
  const allowedTabs: AvatarTab[] = ["battle", "market", "designer", "ranking"];
  const activeTab = allowedTabs.includes((requestedTab as AvatarTab) ?? DEFAULT_TAB)
    ? ((requestedTab as AvatarTab) || DEFAULT_TAB)
    : DEFAULT_TAB;

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-12 text-white">
      <AvatarClient
        headerLabel={t("profilePage.avatarTabTitle")}
        heroTitle={t("profilePage.avatarTabSubtitle")}
        heroDescription=""
        activeTab={activeTab}
        canAccessOwnerTabs={canAccessOwnerTabs}
      />
    </main>
  );
}
