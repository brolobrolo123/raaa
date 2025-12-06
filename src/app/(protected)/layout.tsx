import type { ReactNode } from "react";
import { requireUser } from "@/lib/session";
import { HubActionHud } from "@/components/navigation/hub-action-hud";
import type { Role } from "@/types/roles";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const session = await requireUser();
  const viewer = session.user;

  return (
    <div className="relative min-h-screen pb-44 pt-2 md:pb-56">
      <div className="pb-0">
        {children}
      </div>
      <HubActionHud
        username={viewer?.username ?? null}
        image={viewer?.image ?? null}
        role={(viewer?.role ?? "USER") as Role}
        sprite={viewer?.fabPixelSprite ?? null}
      />
    </div>
  );
}
