"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
} from "react";
import { PixelPreview } from "@/components/avatar/pixel-preview";
import { FabSpriteDesigner } from "@/components/profile/fab-sprite-designer";
import { MiniProfileHoverCard } from "@/components/user/mini-profile-hover-card";
import { parsePixelSprite, type PixelSprite } from "@/lib/pixel-avatar";
import { useTranslations } from "@/lib/i18n/client";
import { HUD_BACKGROUND_PRESETS } from "@/data/hud-backgrounds";
import { getNextUpgradeCost, UPGRADE_LIMITS } from "@/lib/avatar/upgrade-config";
import type { UpgradeType } from "@/lib/avatar/upgrade-config";
import { MessageCircle, X } from "lucide-react";

type AvatarStatusType = "SEARCHING" | "IN_BATTLE" | "COOLDOWN";

type AvatarUserSummary = {
  username: string;
  image?: string | null;
  fabPixelSprite?: string | null;
};

type AvatarOpponentSnapshot = {
  id: string;
  damage: number;
  points: number;
  maxHp: number;
  evasion: number;
  user: AvatarUserSummary;
  hudBackgroundImage?: string | null;
};

type AvatarStatusPayload = {
  id: string;
  username: string;
  image?: string | null;
  hudBackgroundImage?: string | null;
  currentHp: number;
  maxHp: number;
  damage: number;
  evasion: number;
  points: number;
  battlePoints?: number;
  forumPoints?: number;
  forumPointsTotal?: number;
  forumPointsSpent?: number;
  upgradePoints: number;
  hpUpgrades: number;
  damageUpgrades: number;
  evasionUpgrades: number;
  status: AvatarStatusType;
  inBattle: boolean;
  lastBattleAt?: string | null;
  battleLockExpiresAt?: string | null;
  activeBattleId?: string | null;
  activeBattle?: {
    id: string;
    challengerId: string;
    opponentId: string;
    challenger: AvatarOpponentSnapshot;
    opponent: AvatarOpponentSnapshot;
  } | null;
};

type DamageEvent = {
  id: number;
  target: "player" | "opponent";
  amount: number;
};

type BattleEventFrame = {
  attacker: DamageEvent["target"];
  playerHpAfter: number;
  opponentHpAfter: number;
  damage: number;
};

type BattleReplay = {
  battleId: string;
  startAt: number;
  endAt: number;
  durationMs: number;
  events: BattleEventFrame[];
  opponent: AvatarOpponentSnapshot;
};

type AvatarHistoryEntry = {
  id: string;
  log?: string | null;
  rounds?: number | null;
  durationSeconds?: number | null;
  result: string;
  completedAt?: string | null;
  opponent: AvatarOpponentSnapshot;
  youFirst?: boolean;
};

type AvatarItem = {
  id: string;
  name: string;
  description?: string | null;
};

type ShopItem = AvatarItem & {
  price: number;
  image?: string | null;
};

type ChatApiMessage = {
  id: string;
  body: string;
  createdAt: string;
  author: { username: string };
};

type LiveChatMessage = {
  id: string;
  author: string;
  text: string;
  timestamp: number;
  isSelf: boolean;
};

export type AvatarTab = "battle" | "market" | "designer" | "ranking";

const OWNER_ONLY_TABS: AvatarTab[] = ["market", "ranking"];
const DEFAULT_BACKGROUND_PRESET_ID = "fondo1";

const API_ROUTES = {
  status: "/api/avatar/status",
  shop: "/api/avatar/shop",
  items: "/api/avatar/items",
  history: "/api/avatar/history",
  fabSprite: "/api/profile/fab-sprite",
  opponentChat: "/api/avatar/chat/opponent",
  globalChat: "/api/avatar/chat/global",
  upgrades: "/api/avatar/upgrades",
  background: "/api/avatar/background",
};

const DEFAULT_BACKGROUND_IMAGE_SRC = "/hud-backgrounds/fondo1.jpg";
const PANEL_OVERLAY_GRADIENT =
  "linear-gradient(180deg, rgba(3,7,18,0.82), rgba(2,6,23,0.95)), radial-gradient(circle at 15% 20%, rgba(255,255,255,0.08), transparent 50%)";

function buildPanelBackgroundStyle(image?: string | null): CSSProperties {
  const backgroundImageSrc = image ?? DEFAULT_BACKGROUND_IMAGE_SRC;
  return {
    backgroundImage: `${PANEL_OVERLAY_GRADIENT}, url(${backgroundImageSrc})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
  };
}

const POLL_INTERVAL_MS = 5000;
const CHAT_POLL_INTERVAL_MS = 2000;
const BATTLE_COOLDOWN_MS = 15_000;
const BATTLE_TURN_INTERVAL_MS = 1000;
const BATTLE_REPLAY_DELAY_MS = 1200;

interface AvatarClientProps {
  headerLabel: string;
  heroTitle: string;
  heroDescription: string;
  activeTab: AvatarTab;
  canAccessOwnerTabs: boolean;
}

export function AvatarClient({ headerLabel, heroTitle, heroDescription, activeTab, canAccessOwnerTabs }: AvatarClientProps) {
  const t = useTranslations();
  const [status, setStatus] = useState<AvatarStatusPayload | null>(null);
  const [backpackOpen, setBackpackOpen] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const [backpackItems, setBackpackItems] = useState<AvatarItem[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [avatarSprite, setAvatarSprite] = useState<string | null>(null);
  const playerSprite = useMemo(() => parsePixelSprite(avatarSprite), [avatarSprite]);
  const [latestBattle, setLatestBattle] = useState<AvatarHistoryEntry | null>(null);
  const [pendingBattle, setPendingBattle] = useState<AvatarHistoryEntry | null>(null);
  const [playerBounce, setPlayerBounce] = useState(false);
  const [opponentBounce, setOpponentBounce] = useState(false);
  const [damageEvents, setDamageEvents] = useState<DamageEvent[]>([]);
  const damageIdRef = useRef(0);
  const [backgroundSaving, setBackgroundSaving] = useState(false);
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  const opponentBounceTimer = useRef<number | undefined>(undefined);
  const playerBounceTimer = useRef<number | undefined>(undefined);
  const playerAttackTimer = useRef<number | undefined>(undefined);
  const opponentAttackTimer = useRef<number | undefined>(undefined);
  const playerHitTimer = useRef<number | undefined>(undefined);
  const opponentHitTimer = useRef<number | undefined>(undefined);
  const [playerAttack, setPlayerAttack] = useState(false);
  const [opponentAttack, setOpponentAttack] = useState(false);
  const [playerHit, setPlayerHit] = useState(false);
  const [opponentHit, setOpponentHit] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const lastAnnouncedEventRef = useRef(-1);
  const playerImage = status?.image ?? undefined;
  const playerName = status?.username ?? t("avatarPage.labels.selfAvatar");
  const playerUsernameValue = status?.username ?? null;
  const playerAvatarId = status?.id ?? null;
  const playerBackgroundImage = status?.hudBackgroundImage ?? null;
  const playerBackgroundPresetId = useMemo(() => {
    if (!playerBackgroundImage) return DEFAULT_BACKGROUND_PRESET_ID;
    const preset = HUD_BACKGROUND_PRESETS.find((item) => item.src === playerBackgroundImage);
    return preset?.id ?? null;
  }, [playerBackgroundImage]);
  const availableBackgroundPresets = useMemo(
    () => HUD_BACKGROUND_PRESETS.filter((preset) => !preset.ownerOnly || canAccessOwnerTabs),
    [canAccessOwnerTabs],
  );
  const hasLegacyBackground = Boolean(playerBackgroundImage && playerBackgroundPresetId === null);
  const playerPanelStyle = useMemo(() => buildPanelBackgroundStyle(playerBackgroundImage), [playerBackgroundImage]);
  const playerPower = typeof status?.points === "number"
    ? status.points
    : typeof status?.battlePoints === "number"
      ? status.battlePoints
      : typeof status?.forumPoints === "number"
        ? status.forumPoints
        : 0;
  const playerMaxHp = typeof status?.maxHp === "number" ? status.maxHp : 100;
  const playerDamage = typeof status?.damage === "number" ? status.damage : 1;
  const playerEvasion = typeof status?.evasion === "number" ? status.evasion : 0;
  const playerMaxHpValue = playerMaxHp;
  const playerDamageValue = playerDamage;
  const forumPointsAvailable = typeof status?.forumPoints === "number"
    ? status.forumPoints
    : typeof status?.upgradePoints === "number"
      ? status.upgradePoints
      : 0;
  const upgradePoints = forumPointsAvailable;
  const hpUpgradeCount = status?.hpUpgrades ?? 0;
  const damageUpgradeCount = status?.damageUpgrades ?? 0;
  const evasionUpgradeCount = status?.evasionUpgrades ?? 0;
  const activeBattleOpponent = useMemo(() => {
    if (!status?.activeBattle || !status?.id) return null;
    const youAreChallenger = status.activeBattle.challengerId === status.id;
    const opponentSnapshot = youAreChallenger ? status.activeBattle.opponent : status.activeBattle.challenger;
    return opponentSnapshot ?? null;
  }, [status?.activeBattle, status?.id]);
  const opponentAvatar = latestBattle?.opponent ?? activeBattleOpponent ?? null;
  const opponentAvatarId = opponentAvatar?.id ?? null;
  const opponentSpriteSource = opponentAvatar?.user.fabPixelSprite ?? null;
  const opponentSprite = useMemo(() => parsePixelSprite(opponentSpriteSource), [opponentSpriteSource]);
  const opponentDamageValue = typeof opponentAvatar?.damage === "number" ? opponentAvatar.damage : playerDamageValue;
  const opponentMaxHpValue = typeof opponentAvatar?.maxHp === "number" ? opponentAvatar.maxHp : playerMaxHpValue;
  const opponentImage = opponentAvatar?.user.image ?? undefined;
  const isSelfOpponent = Boolean(playerAvatarId && opponentAvatarId && opponentAvatarId === playerAvatarId);
  const [opponentChatMessages, setOpponentChatMessages] = useState<LiveChatMessage[]>([]);
  const [opponentChatDraft, setOpponentChatDraft] = useState("");
  const [globalChatMessages, setGlobalChatMessages] = useState<LiveChatMessage[]>([]);
  const [globalChatDraft, setGlobalChatDraft] = useState("");
  const opponentChatLogRef = useRef<HTMLDivElement | null>(null);
  const globalChatLogRef = useRef<HTMLDivElement | null>(null);
  const [sendingOpponentChat, setSendingOpponentChat] = useState(false);
  const [sendingGlobalChat, setSendingGlobalChat] = useState(false);
  const [upgradeBusy, setUpgradeBusy] = useState<UpgradeType | null>(null);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [mobileChatTab, setMobileChatTab] = useState<"battle" | "global">("battle");
  const [desktopChatOpen, setDesktopChatOpen] = useState(false);
  const [desktopChatTab, setDesktopChatTab] = useState<"battle" | "global">("battle");
  const [isDesktop, setIsDesktop] = useState(false);
  const cooldownUntil = useMemo(() => {
    if (!status?.lastBattleAt) return null;
    return new Date(status.lastBattleAt).getTime() + BATTLE_COOLDOWN_MS;
  }, [status?.lastBattleAt]);
  const cooldownRemainingMs = cooldownUntil ? Math.max(0, cooldownUntil - nowTs) : 0;
  const statusInBattle = status?.status === "IN_BATTLE" || status?.inBattle;

  const battleReplay = useMemo(() => {
    if (!latestBattle || !opponentAvatar || isSelfOpponent) return null;
    let playerHp = playerMaxHpValue;
    let opponentHp = opponentMaxHpValue;
    const events: BattleEventFrame[] = [];
    let attacker: DamageEvent["target"] = latestBattle.youFirst ? "player" : "opponent";
    const plannedRounds = Math.max(1, latestBattle.rounds || Math.ceil((playerHp + opponentHp) / Math.max(playerDamageValue, 1)));
    for (let round = 0; round < plannedRounds; round++) {
      if (attacker === "player") {
        opponentHp = Math.max(0, opponentHp - playerDamageValue);
        events.push({ attacker: "player", damage: playerDamageValue, playerHpAfter: playerHp, opponentHpAfter: opponentHp });
        if (opponentHp <= 0) break;
        attacker = "opponent";
        continue;
      }
      playerHp = Math.max(0, playerHp - opponentDamageValue);
      events.push({ attacker: "opponent", damage: opponentDamageValue, playerHpAfter: playerHp, opponentHpAfter: opponentHp });
      if (playerHp <= 0) break;
      attacker = "player";
    }
    if (events.length === 0) {
      events.push({ attacker: latestBattle.youFirst ? "player" : "opponent", damage: 0, playerHpAfter: playerHp, opponentHpAfter: opponentHp });
    }
    const derivedDurationMs = events.length * BATTLE_TURN_INTERVAL_MS;
    const durationMs = Math.max(derivedDurationMs, (latestBattle.durationSeconds ?? events.length) * 1000);
    const completedAtMs = latestBattle.completedAt ? new Date(latestBattle.completedAt).getTime() : Date.now();
    const startAt = completedAtMs + BATTLE_REPLAY_DELAY_MS;
    const endAt = startAt + durationMs;
    return { battleId: latestBattle.id, startAt, endAt, durationMs, events, opponent: opponentAvatar } as BattleReplay;
  }, [latestBattle, opponentAvatar, isSelfOpponent, playerMaxHpValue, opponentMaxHpValue, playerDamageValue, opponentDamageValue]);
  const currentBattleId = battleReplay?.battleId ?? null;
  const awaitingLiveBattle = statusInBattle && !battleReplay;

  const battlePhase = useMemo(() => {
    if (!battleReplay) return { state: "idle" as const, eventIndex: -1 };
    if (nowTs < battleReplay.startAt) {
      return { state: "countdown" as const, eventIndex: -1, countdownMs: battleReplay.startAt - nowTs };
    }
    if (nowTs >= battleReplay.endAt) {
      return { state: "finished" as const, eventIndex: battleReplay.events.length - 1 };
    }
    const elapsed = nowTs - battleReplay.startAt;
    const index = Math.min(battleReplay.events.length - 1, Math.floor(elapsed / BATTLE_TURN_INTERVAL_MS));
    return { state: "active" as const, eventIndex: index };
  }, [battleReplay, nowTs]);

  useEffect(() => {
    if (!pendingBattle) return;
    if (battlePhase.state !== "finished") return;
    setLatestBattle(pendingBattle);
    setPendingBattle(null);
  }, [battlePhase.state, pendingBattle]);

  const applyLatestBattle = useCallback(
    (entry: AvatarHistoryEntry | null) => {
      if (!entry) return;
      setLatestBattle((previous) => {
        if (previous?.id === entry.id) {
          return previous;
        }
        if (battleReplay && battlePhase.state !== "finished") {
          setPendingBattle(entry);
          return previous;
        }
        setPendingBattle(null);
        return entry;
      });
    },
    [battleReplay, battlePhase.state],
  );

  const displayHps = useMemo(() => {
    if (!battleReplay || battleReplay.events.length === 0) {
      return {
        player: typeof status?.currentHp === "number" ? status.currentHp : playerMaxHpValue,
        opponent: opponentMaxHpValue,
      };
    }
    let playerHp = playerMaxHpValue;
    let opponentHp = opponentMaxHpValue;
    const lastIndex =
      battlePhase.state === "active" || battlePhase.state === "finished"
        ? Math.max(0, battlePhase.eventIndex)
        : -1;

    for (let i = 0; i <= lastIndex; i++) {
      const frame = battleReplay.events[i];
      if (!frame) break;
      playerHp = frame.playerHpAfter;
      opponentHp = frame.opponentHpAfter;
    }

    if (lastIndex < 0) {
      playerHp = playerMaxHpValue;
      opponentHp = opponentMaxHpValue;
    }

    return { player: playerHp, opponent: opponentHp };
  }, [battleReplay, battlePhase, playerMaxHpValue, opponentMaxHpValue, status?.currentHp]);

  const displayPlayerHp = displayHps.player;
  const battleActive = battlePhase.state === "active";
  const battleFinished = battlePhase.state === "finished";
  const battleCountdown = battlePhase.state === "countdown";
  const hasReplayOpponent = Boolean(battleReplay) && !isSelfOpponent;
  const hasActiveOpponent = statusInBattle && Boolean(activeBattleOpponent) && !isSelfOpponent;
  const showOpponent = (hasReplayOpponent && battlePhase.state !== "idle") || hasActiveOpponent;
  const cooldownActive = useMemo(() => {
    if (!cooldownUntil) return false;
    if (battleActive || battleCountdown || statusInBattle) return false;
    return cooldownRemainingMs > 0;
  }, [battleActive, battleCountdown, statusInBattle, cooldownRemainingMs, cooldownUntil]);
  const displayOpponentHp = (() => {
    if (hasReplayOpponent) return displayHps.opponent;
    if (hasActiveOpponent) return activeBattleOpponent?.maxHp ?? "--";
    return "--";
  })();
  const opponentUsername = showOpponent
    ? hasReplayOpponent
      ? battleReplay?.opponent.user.username ?? t("avatarPage.opponent.default")
      : activeBattleOpponent?.user.username ?? t("avatarPage.opponent.default")
    : awaitingLiveBattle
      ? t("avatarPage.opponent.duelInProgress")
      : cooldownActive
        ? t("avatarPage.opponent.resting")
        : t("avatarPage.opponent.searching");
  const opponentPanelTag = (() => {
    if (hasActiveOpponent) return null;
    if (awaitingLiveBattle) return null;
    if (battleActive) return null;
    if (!showOpponent) return t("avatarPage.opponent.panelSearching");
    if (battleFinished) return t("avatarPage.opponent.battleFinished");
    if (battleCountdown) {
      const remainMs = Math.max(0, (battleReplay?.startAt ?? nowTs) - nowTs);
      return t("avatarPage.opponent.startsIn").replace("{seconds}", Math.ceil(remainMs / 1000).toString());
    }
    return t("avatarPage.opponent.panelLabel");
  })();
  const opponentImageDisplay = showOpponent ? opponentImage : undefined;
  const opponentBattlePointsRaw = showOpponent
    ? hasReplayOpponent
      ? opponentAvatar?.points
      : activeBattleOpponent?.points
    : null;
  const opponentPowerDisplay = showOpponent
    ? typeof opponentBattlePointsRaw === "number"
      ? opponentBattlePointsRaw
      : "--"
    : awaitingLiveBattle
      ? ""
      : "--";
  const opponentDamageDisplay = opponentDamageValue;
  const opponentEvasionDisplay = showOpponent
    ? typeof opponentAvatar?.evasion === "number"
      ? opponentAvatar.evasion
      : "--"
    : awaitingLiveBattle
      ? ""
      : "--";
  const opponentBackgroundSource = showOpponent
    ? hasReplayOpponent
      ? opponentAvatar?.hudBackgroundImage ?? null
      : activeBattleOpponent?.hudBackgroundImage ?? null
    : null;
  const opponentPanelStyle = useMemo(
    () => buildPanelBackgroundStyle(opponentBackgroundSource),
    [opponentBackgroundSource],
  );
  const mapChatMessages = useCallback(
    (messages: ChatApiMessage[]) =>
      messages.map((message) => ({
        id: message.id,
        author: message.author.username,
        text: message.body,
        timestamp: new Date(message.createdAt).getTime(),
        isSelf: Boolean(playerUsernameValue && message.author.username === playerUsernameValue),
      })),
    [playerUsernameValue],
  );
  const showCooldownCountdown = useMemo(() => {
    if (battleActive || battleCountdown) return false;
    if (statusInBattle) return false;
    return status?.status === "COOLDOWN" && cooldownActive;
  }, [battleActive, battleCountdown, statusInBattle, status?.status, cooldownActive]);

  const nextBattleCountdownMs = showCooldownCountdown ? cooldownRemainingMs : null;
  const opponentChatEnabled = Boolean(currentBattleId && !isSelfOpponent);
  const desktopChatFabVisible = useMemo(
    () => isDesktop && ["battle", "market", "designer", "ranking"].includes(activeTab),
    [isDesktop, activeTab],
  );
  const upgradeOptions = useMemo(
    () => [
      {
        id: "hp" as const,
        label: t("avatarPage.upgrades.hpLabel"),
        description: t("avatarPage.upgrades.hpDescription"),
        bonus: t("avatarPage.upgrades.hpBonus"),
        cost: getNextUpgradeCost("hp", hpUpgradeCount),
        current: hpUpgradeCount,
        max: UPGRADE_LIMITS.hp,
      },
      {
        id: "damage" as const,
        label: t("avatarPage.upgrades.damageLabel"),
        description: t("avatarPage.upgrades.damageDescription"),
        bonus: t("avatarPage.upgrades.damageBonus"),
        cost: getNextUpgradeCost("damage", damageUpgradeCount),
        current: damageUpgradeCount,
        max: UPGRADE_LIMITS.damage,
      },
      {
        id: "evasion" as const,
        label: t("avatarPage.upgrades.evasionLabel"),
        description: t("avatarPage.upgrades.evasionDescription"),
        bonus: t("avatarPage.upgrades.evasionBonus"),
        cost: getNextUpgradeCost("evasion", evasionUpgradeCount),
        current: evasionUpgradeCount,
        max: UPGRADE_LIMITS.evasion,
      },
    ],
    [hpUpgradeCount, damageUpgradeCount, evasionUpgradeCount, t],
  );

  const renderAvatarFace = (
    imageSrc: string | undefined,
    label: string | undefined,
    username?: string | null,
    align: "left" | "right" = "left",
  ) => {
    const face = (
      <div className="avatar-face" style={imageSrc ? { backgroundImage: `url(${imageSrc})` } : undefined}>
        {!imageSrc && <span>{label?.charAt(0) ?? "?"}</span>}
      </div>
    );
    if (!username) {
      return face;
    }
    return (
      <MiniProfileHoverCard username={username} align={align} variant="battle">
        {face}
      </MiniProfileHoverCard>
    );
  };

  const loadLatestBattle = useCallback(async () => {
    const payload = await fetchJson<{ history: AvatarHistoryEntry[] }>(API_ROUTES.history);
    return payload?.history?.[0] ?? null;
  }, []);

  const fetchOpponentChat = useCallback(async () => {
    if (!currentBattleId) {
      setOpponentChatMessages([]);
      return;
    }
    const payload = await fetchJson<{ messages: ChatApiMessage[] }>(
      `${API_ROUTES.opponentChat}?battleId=${encodeURIComponent(currentBattleId)}`,
    );
    if (payload?.messages) {
      setOpponentChatMessages(mapChatMessages(payload.messages));
    }
  }, [currentBattleId, mapChatMessages]);

  const fetchGlobalChat = useCallback(async () => {
    const payload = await fetchJson<{ messages: ChatApiMessage[] }>(API_ROUTES.globalChat);
    if (payload?.messages) {
      setGlobalChatMessages(mapChatMessages(payload.messages));
    }
  }, [mapChatMessages]);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const entry = await loadLatestBattle();
      if (!canceled) {
        applyLatestBattle(entry);
      }
    })();
    return () => {
      canceled = true;
    };
  }, [status?.lastBattleAt, loadLatestBattle, applyLatestBattle]);

  useEffect(() => {
    if (!currentBattleId) {
      setOpponentChatMessages([]);
      return;
    }
    fetchOpponentChat();
    const tick = window.setInterval(fetchOpponentChat, CHAT_POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(tick);
    };
  }, [currentBattleId, fetchOpponentChat]);

  useEffect(() => {
    fetchGlobalChat();
    const tick = window.setInterval(fetchGlobalChat, CHAT_POLL_INTERVAL_MS);
    return () => {
      window.clearInterval(tick);
    };
  }, [fetchGlobalChat]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setNowTs(Date.now());
    }, 300);
    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(min-width: 1024px)");
    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(event.matches);
    };

    handleChange(query);
    const listener = (event: MediaQueryListEvent) => handleChange(event);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  useEffect(() => {
    if (!isDesktop) {
      setDesktopChatOpen(false);
    }
  }, [isDesktop]);

  useEffect(() => {
    if (!desktopChatFabVisible) {
      setDesktopChatOpen(false);
    }
  }, [desktopChatFabVisible]);


  const refreshStatus = useCallback(async () => {
    const json = await fetchJson<AvatarStatusPayload>(API_ROUTES.status);
    if (json) {
      setStatus(json);
    }
  }, []);

  const handleSendOpponentChat = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = opponentChatDraft.trim();
      if (!trimmed || !currentBattleId) return;
      setSendingOpponentChat(true);
      try {
        const response = await fetch(API_ROUTES.opponentChat, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ battleId: currentBattleId, message: trimmed }),
        });
        if (!response.ok) return;
        setOpponentChatDraft("");
        await fetchOpponentChat();
      } finally {
        setSendingOpponentChat(false);
      }
    },
    [opponentChatDraft, currentBattleId, fetchOpponentChat],
  );

  const handleSendGlobalChat = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = globalChatDraft.trim();
      if (!trimmed) return;
      setSendingGlobalChat(true);
      try {
        const response = await fetch(API_ROUTES.globalChat, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        });
        if (!response.ok) return;
        setGlobalChatDraft("");
        await fetchGlobalChat();
      } finally {
        setSendingGlobalChat(false);
      }
    },
    [globalChatDraft, fetchGlobalChat],
  );

  const handleUpgrade = useCallback(
    async (type: UpgradeType) => {
      setUpgradeError(null);
      setUpgradeBusy(type);
      try {
        const response = await fetch(API_ROUTES.upgrades, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        let payload: { error?: string } | null = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
        if (!response.ok) {
          throw new Error(payload?.error ?? t("avatarPage.upgrades.error"));
        }
        await refreshStatus();
      } catch (error) {
        setUpgradeError(error instanceof Error ? error.message : t("avatarPage.upgrades.error"));
      } finally {
        setUpgradeBusy(null);
      }
    },
    [refreshStatus, t],
  );

  const handleBackgroundSelect = useCallback(
    async (backgroundId: string) => {
      setBackgroundError(null);
      setBackgroundSaving(true);
      try {
        const response = await fetch(API_ROUTES.background, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ backgroundId }),
        });
        let payload: { error?: string } | null = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
        if (!response.ok) {
          throw new Error(payload?.error ?? t("avatarPage.backgroundUploader.error"));
        }
        await refreshStatus();
      } catch (error) {
        setBackgroundError(error instanceof Error ? error.message : t("avatarPage.backgroundUploader.error"));
      } finally {
        setBackgroundSaving(false);
      }
    },
    [refreshStatus, t],
  );

  const statusChip = useMemo<{ label: string; accent: string } | null>(() => {
    if (!status) return { label: t("avatarPage.statusChip.loading"), accent: "bg-slate-500/40" };
    if (statusInBattle) return null;
    if (battlePhase.state === "countdown") return { label: t("avatarPage.statusChip.preparing"), accent: "bg-indigo-600/70" };
    if (battleActive) return null;
    if (cooldownActive) return { label: t("avatarPage.statusChip.resting"), accent: "bg-amber-500/70" };
    return { label: t("avatarPage.statusChip.searching"), accent: "bg-emerald-500/70" };
  }, [status, statusInBattle, battlePhase.state, battleActive, cooldownActive, t]);


  const addDamageEvent = useCallback((target: DamageEvent["target"], amount: number) => {
    const safeAmount = Math.max(1, Math.round(amount));
    const id = damageIdRef.current++;
    setDamageEvents((prev) => [...prev, { id, target, amount: safeAmount }]);
    window.setTimeout(() => {
      setDamageEvents((prev) => prev.filter((event) => event.id !== id));
    }, 1400);
    if (target === "player") {
      setPlayerBounce(true);
      if (playerBounceTimer.current) window.clearTimeout(playerBounceTimer.current);
      playerBounceTimer.current = window.setTimeout(() => setPlayerBounce(false), 600);
      setPlayerHit(true);
      setOpponentAttack(true);
      if (playerHitTimer.current) window.clearTimeout(playerHitTimer.current);
      if (opponentAttackTimer.current) window.clearTimeout(opponentAttackTimer.current);
      playerHitTimer.current = window.setTimeout(() => setPlayerHit(false), 1000);
      opponentAttackTimer.current = window.setTimeout(() => setOpponentAttack(false), 600);
      return;
    }

    setOpponentBounce(true);
    if (opponentBounceTimer.current) window.clearTimeout(opponentBounceTimer.current);
    opponentBounceTimer.current = window.setTimeout(() => setOpponentBounce(false), 600);
    setOpponentHit(true);
    setPlayerAttack(true);
    if (opponentHitTimer.current) window.clearTimeout(opponentHitTimer.current);
    if (playerAttackTimer.current) window.clearTimeout(playerAttackTimer.current);
    opponentHitTimer.current = window.setTimeout(() => setOpponentHit(false), 1000);
    playerAttackTimer.current = window.setTimeout(() => setPlayerAttack(false), 600);
  }, []);

  useEffect(() => {
    lastAnnouncedEventRef.current = -1;
  }, [battleReplay?.battleId]);



  useEffect(() => {
    if (!battleReplay) return;
    if (battlePhase.state === "idle") return;
    const index =
      battlePhase.state === "finished"
        ? battleReplay.events.length - 1
        : battlePhase.eventIndex;
    if (index === undefined || index === null || index < 0) return;
    if (index === lastAnnouncedEventRef.current) return;
    const frame = battleReplay.events[index];
    if (!frame) return;
    lastAnnouncedEventRef.current = index;
    const target = frame.attacker === "player" ? "opponent" : "player";
    addDamageEvent(target, frame.damage);
  }, [battleReplay, battlePhase, addDamageEvent]);

  useEffect(() => {
    refreshStatus();
    const handler = setInterval(refreshStatus, POLL_INTERVAL_MS);
    return () => clearInterval(handler);
  }, [refreshStatus]);

  useEffect(() => {
    if (!opponentChatLogRef.current) return;
    opponentChatLogRef.current.scrollTop = opponentChatLogRef.current.scrollHeight;
  }, [opponentChatMessages]);

  useEffect(() => {
    if (!globalChatLogRef.current) return;
    globalChatLogRef.current.scrollTop = globalChatLogRef.current.scrollHeight;
  }, [globalChatMessages]);

  useEffect(() => {
    let canceled = false;
    (async () => {
      const payload = await fetchJson<{ sprite: string | null }>(API_ROUTES.fabSprite);
      if (!canceled) {
        setAvatarSprite(payload?.sprite ?? null);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);


  useEffect(() => {
    return () => {
      if (playerBounceTimer.current) {
        window.clearTimeout(playerBounceTimer.current);
      }
      if (opponentBounceTimer.current) {
        window.clearTimeout(opponentBounceTimer.current);
      }
      if (playerAttackTimer.current) {
        window.clearTimeout(playerAttackTimer.current);
      }
      if (opponentAttackTimer.current) {
        window.clearTimeout(opponentAttackTimer.current);
      }
      if (playerHitTimer.current) {
        window.clearTimeout(playerHitTimer.current);
      }
      if (opponentHitTimer.current) {
        window.clearTimeout(opponentHitTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!backpackOpen) return;
    (async () => {
      const payload = await fetchJson<{ items: AvatarItem[] }>(API_ROUTES.items);
      if (payload?.items) {
        setBackpackItems(payload.items);
      }
    })();
  }, [backpackOpen]);

  useEffect(() => {
    if (!shopOpen) return;
    (async () => {
      const payload = await fetchJson<{ items: ShopItem[] }>(API_ROUTES.shop);
      if (payload?.items) {
        setShopItems(payload.items);
      }
    })();
  }, [shopOpen]);

  const battleSection = (
    <section id="battle-section" className="scroll-mt-32 space-y-6">
      <div className="grid gap-6">
        <div className="avatar-stage is-wide w-full rounded-2xl border border-white/10 bg-[#041014]/50 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
          <div className="arena-grid">
            <div className="character-panel player-panel" style={playerPanelStyle}>
              <div className="avatar-header">
                {renderAvatarFace(playerImage, playerName, playerUsernameValue)}
                <div className="avatar-meta">
                  <p className="avatar-username">{playerName}</p>
                  <p className="avatar-power">{t("avatarPage.stats.power")} {playerPower}</p>
                </div>
              </div>
              <div
                className={`pixel-sprite player ${playerBounce ? "pixel-bounce" : ""} ${playerAttack ? "pixel-attack" : ""} ${playerHit ? "pixel-hit" : ""}`}
              >
                <BattleSpriteFigure sprite={playerSprite} orientation="player" />
              </div>
              <div className="character-details">
                <p className="character-stat">{t("avatarPage.stats.hp")} {displayPlayerHp} / {playerMaxHp}</p>
                <p className="character-stat">{t("avatarPage.stats.damage")} {playerDamage}</p>
                <p className="character-stat">{t("avatarPage.stats.evasion")} {playerEvasion}</p>
              </div>
            </div>
            <div className="vs-burst" aria-hidden="true" />
            <div className="character-panel opponent-panel" style={opponentPanelStyle}>
              {opponentPanelTag && <p className="character-panel-tag">{opponentPanelTag}</p>}
              <div className="avatar-header">
                {renderAvatarFace(
                  opponentImageDisplay,
                  opponentUsername,
                  showOpponent ? opponentUsername : null,
                  "right",
                )}
                <div className="avatar-meta">
                  <p className="avatar-username">{opponentUsername}</p>
                  <p className="avatar-power">{t("avatarPage.stats.power")} {opponentPowerDisplay}</p>
                </div>
              </div>
              <div
                className={`pixel-sprite opponent ${opponentBounce ? "pixel-bounce" : ""} ${opponentAttack ? "pixel-attack" : ""} ${opponentHit ? "pixel-hit" : ""}`}
              >
                <BattleSpriteFigure sprite={opponentSprite} orientation="opponent" />
              </div>
              <div className="character-details">
                <p className="character-stat">
                  {t("avatarPage.stats.hp")} {showOpponent ? `${displayOpponentHp} / ${opponentMaxHpValue}` : displayOpponentHp}
                </p>
                <p className="character-stat">{t("avatarPage.stats.damage")} {opponentDamageDisplay}</p>
                <p className="character-stat">{t("avatarPage.stats.evasion")} {opponentEvasionDisplay}</p>
              </div>
            </div>
          </div>
        </div>
          {damageEvents.map((event) => (
            <span key={event.id} className={`floating-damage floating-damage-${event.target}`}>
              -{event.amount}
            </span>
          ))}
          <div className="arena-status mt-6 text-sm">
            {statusChip && <span className={`status-chip ${statusChip.accent}`}>{statusChip.label}</span>}
            {typeof nextBattleCountdownMs === "number" && (
              <span className="status-chip status-chip--cooldown">
                {t("avatarPage.battle.cooldownCountdown").replace("{seconds}", Math.ceil(nextBattleCountdownMs / 1000).toString())}
              </span>
            )}
          </div>
      </div>
    </section>
  );

  const marketSection = (
    <section id="market-section" className="scroll-mt-32 rounded-3xl border border-cyan-200/20 bg-cyan-500/5 p-6 text-cyan-50 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="avatar-stage w-full rounded-2xl border border-white/10 bg-[#041014]/50 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.65)]">
            <p className="mt-2 text-sm text-cyan-100/70">{t("avatarPage.market.description")}</p>
          </div>
          <div className="flex flex-col gap-3 md:w-auto md:flex-row">
            <button
              type="button"
              className="rounded-2xl border border-cyan-200/50 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-50 transition hover:bg-cyan-400/20"
              onClick={() => setShopOpen(true)}
            >
              {t("avatarPage.market.openShop")}
            </button>
            <button
              type="button"
              className="rounded-2xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
              onClick={() => setBackpackOpen(true)}
            >
              {t("avatarPage.market.openBackpack")}
            </button>
          </div>
        </div>
    </section>
  );

  const designerSection = (
    <section id="avatar-designer" className="scroll-mt-32 rounded-3xl border border-fuchsia-200/20 bg-gradient-to-br from-[#130422]/80 via-[#1b0a2f]/80 to-[#05010a]/90 p-6 shadow-[0_30px_80px_rgba(86,12,115,0.35)]">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-fuchsia-200/70">{t("avatarPage.designer.title")}</p>
            <h2 className="mt-1 text-2xl font-semibold">{t("avatarPage.designer.subtitle")}</h2>
          </div>
          <FabSpriteDesigner
            initialSprite={avatarSprite}
            availablePoints={status?.battlePoints ?? status?.points ?? 0}
          />
          <div id="avatar-upgrades" className="rounded-3xl border border-white/15 bg-white/5 p-5 text-white">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.4em] text-white/70">{t("avatarPage.upgrades.title")}</p>
                <h3 className="mt-1 text-xl font-semibold">{t("avatarPage.upgrades.subtitle")}</h3>
                <p className="text-sm text-white/80">{t("avatarPage.upgrades.description")}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.35em] text-white/60">{t("avatarPage.upgrades.pointsLabel")}</p>
                <p className="text-3xl font-bold text-white">{upgradePoints}</p>
              </div>
            </div>
            {upgradeError && <p className="mt-3 text-sm text-rose-200">{upgradeError}</p>}
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {upgradeOptions.map((option) => {
                const maxed = option.current >= option.max;
                const cost = option.cost;
                const insufficient = typeof cost === "number" ? upgradePoints < cost : false;
                const busy = upgradeBusy === option.id;
                const disabled = maxed || insufficient || upgradeBusy !== null;
                const remaining = Math.max(0, option.max - option.current);
                return (
                  <div key={option.id} className="rounded-2xl border border-white/10 bg-white/10 p-4 text-sm">
                    <div className="flex items-center justify-between text-[0.65rem] uppercase tracking-[0.3em] text-white/70">
                      <span>{option.label}</span>
                      <span>
                        {option.current}/{option.max}
                      </span>
                    </div>
                    <p className="mt-2 text-base font-semibold text-white">{option.bonus}</p>
                    <p className="mt-1 text-xs text-white/70">{option.description}</p>
                    <p className="mt-2 text-xs text-white/80">
                      {typeof cost === "number"
                        ? t("avatarPage.upgrades.cost").replace("{cost}", cost.toString())
                        : t("avatarPage.upgrades.maxed")}
                    </p>
                    {maxed ? (
                      <p className="mt-2 text-xs text-emerald-200">{t("avatarPage.upgrades.maxed")}</p>
                    ) : (
                      <p className="mt-2 text-xs text-white/60">{t("avatarPage.upgrades.remaining").replace("{count}", remaining.toString())}</p>
                    )}
                    {insufficient && !maxed && typeof cost === "number" && (
                      <p className="mt-1 text-xs text-rose-200">{t("avatarPage.upgrades.insufficient").replace("{cost}", cost.toString())}</p>
                    )}
                    <button
                      type="button"
                      className="mt-3 w-full rounded-2xl border border-white/30 px-4 py-2 text-sm font-semibold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => handleUpgrade(option.id)}
                      disabled={disabled}
                    >
                      {busy
                        ? t("avatarPage.upgrades.applying")
                        : maxed
                          ? t("avatarPage.upgrades.completed")
                          : t("avatarPage.upgrades.apply")}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="mt-4 rounded-3xl border border-white/15 bg-white/5 p-5 text-white">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.4em] text-white/70">{t("avatarPage.backgroundUploader.title")}</p>
              <h3 className="text-xl font-semibold">{t("avatarPage.backgroundUploader.subtitle")}</h3>
              <p className="text-sm text-white/80">{t("avatarPage.backgroundUploader.description")}</p>
              {hasLegacyBackground && (
                <p className="text-xs text-amber-200/90">{t("avatarPage.backgroundUploader.legacyNotice")}</p>
              )}
              {backgroundError && <p className="text-sm text-rose-200">{backgroundError}</p>}
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {availableBackgroundPresets.map((preset) => {
                const selected = playerBackgroundPresetId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`flex flex-col rounded-2xl border px-3 py-3 text-left text-white transition ${selected ? "border-white/70 bg-white/10" : "border-white/15 bg-black/20 hover:border-white/30"}`}
                    onClick={() => handleBackgroundSelect(preset.id)}
                    disabled={backgroundSaving}
                  >
                    <div
                      className="h-28 w-full rounded-xl border border-white/10"
                      style={{
                        backgroundImage: `linear-gradient(180deg, rgba(3,7,18,0.82), rgba(2,6,23,0.95)), url(${preset.src})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                      }}
                    />
                    <p className="mt-3 text-sm font-semibold">{t(preset.labelKey as Parameters<typeof t>[0])}</p>
                    <p className="text-xs text-white/70">{t(preset.descriptionKey as Parameters<typeof t>[0])}</p>
                    {selected && <span className="mt-2 text-[11px] uppercase tracking-[0.4em] text-emerald-200">{t("avatarPage.backgroundUploader.selectedTag")}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
    </section>
  );

  const rankingSection = (
    <section id="ranking-section" className="scroll-mt-32 rounded-3xl border border-amber-200/20 bg-amber-500/5 p-6 text-amber-50">
        <p className="text-xs uppercase tracking-[0.4em] text-amber-200/80">{t("avatarPage.ranking.tag")}</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">{t("avatarPage.ranking.title")}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-amber-100/70">{t("avatarPage.ranking.stats.points")}</p>
            <p className="text-3xl font-bold text-white">{status?.points ?? 0}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-amber-100/70">{t("avatarPage.ranking.stats.maxHp")}</p>
            <p className="text-3xl font-bold text-white">{playerMaxHp}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm text-amber-100/70">{t("avatarPage.ranking.stats.damage")}</p>
            <p className="text-3xl font-bold text-white">{playerDamage}</p>
          </div>
        </div>
        {latestBattle && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-amber-100/80">
            <p className="uppercase tracking-[0.3em] text-amber-200/60">{t("avatarPage.ranking.lastBattleLabel")}</p>
            <p className="mt-2 text-base text-white">
              {t("avatarPage.ranking.lastBattleSummary")
                .replace("{opponent}", latestBattle.opponent.user.username)
                .replace("{result}", latestBattle.result)}
            </p>
          </div>
        )}
    </section>
  );

  const tabViews: Record<AvatarTab, ReactNode> = {
    battle: battleSection,
    market: marketSection,
    designer: designerSection,
    ranking: rankingSection,
  };
  const isOwnerOnlyTab = OWNER_ONLY_TABS.includes(activeTab);
  const currentSection = !canAccessOwnerTabs && isOwnerOnlyTab
    ? <OwnerLockedNotice tab={activeTab} />
    : tabViews[activeTab] ?? battleSection;

  return (
    <>
      <div className="space-y-10">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{headerLabel}</p>
          <h1 className="text-4xl font-semibold">{heroTitle}</h1>
          <p className="text-slate-400">{heroDescription}</p>
          <div>
            <a
              href="#avatar-upgrades"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/10"
            >
              {t("avatarPage.goToUpgrades")}
              <span aria-hidden="true">→</span>
            </a>
          </div>
        </header>

        {currentSection}

        {backpackOpen && (
          <Modal
            onClose={() => setBackpackOpen(false)}
            title={t("avatarPage.modals.backpackTitle")} 
            closeLabel={t("avatarPage.modals.close")}
          >
            {backpackItems.length === 0 ? (
              <p className="text-sm text-slate-300">{t("avatarPage.modals.emptyBackpack")}</p>
            ) : (
              <ul className="space-y-3">
                {backpackItems.map((item) => (
                  <li key={item.id} className="rounded-2xl border border-white/10 bg-[#0a1524]/70 p-3">
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.description ?? t("avatarPage.modals.noDescription")}</p>
                  </li>
                ))}
              </ul>
            )}
          </Modal>
        )}

        {shopOpen && (
        <Modal
            onClose={() => setShopOpen(false)}
            title={t("avatarPage.modals.shopTitle")}
            closeLabel={t("avatarPage.modals.close")}
          >
            <ul className="space-y-3">
              {shopItems.map((item) => (
                <li key={item.id} className="rounded-2xl border border-white/10 bg-[#0a1524]/70 p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-white">{item.name}</p>
                    <span className="text-sm text-amber-300">{item.price} pts</span>
                  </div>
                  <p className="text-xs text-slate-400">{item.description ?? t("avatarPage.modals.noDescription")}</p>
                </li>
              ))}
            </ul>
          </Modal>
        )}
      </div>

      <button
        type="button"
        className="battle-chat-fab"
        onClick={() => setMobileChatOpen(true)}
        aria-label={t("avatarPage.battle.openMobileChat")}
      >
        <MessageCircle size={24} />
      </button>

      {mobileChatOpen && (
        <div className="mobile-chat-overlay" role="dialog" aria-modal="true">
          <div className="mobile-chat-panel">
            <div className="mobile-chat-panel__header">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">{t("avatarPage.battle.mobileChatTitle")}</p>
              <button
                type="button"
                className="mobile-chat-close"
                onClick={() => setMobileChatOpen(false)}
                aria-label={t("common.close")}
              >
                <X size={18} />
              </button>
            </div>
            <div className="mobile-chat-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                className={mobileChatTab === "battle" ? "active" : ""}
                onClick={() => setMobileChatTab("battle")}
              >
                {t("avatarPage.battle.battleChatTitle")}
              </button>
              <button
                type="button"
                role="tab"
                className={mobileChatTab === "global" ? "active" : ""}
                onClick={() => setMobileChatTab("global")}
              >
                {t("avatarPage.battle.globalChatTitle")}
              </button>
            </div>
            <div className="mobile-chat-body">
              {mobileChatTab === "battle" ? (
                <>
                  <div className="mobile-chat-log">
                    {opponentChatMessages.map((message) => (
                      <p key={message.id} className="battle-chat__item">
                        <span className="battle-chat__author">
                          {message.author}
                          {message.isSelf ? t("avatarPage.battle.selfSuffix") : ""}
                        </span>
                        <span className="battle-chat__text">{message.text}</span>
                      </p>
                    ))}
                    {!opponentChatMessages.length && (
                      <p className="battle-chat__hint">{t("avatarPage.battle.battleChatEmpty")}</p>
                    )}
                  </div>
                  <form className="battle-chat__form" onSubmit={handleSendOpponentChat}>
                    <input
                      type="text"
                      value={opponentChatDraft}
                      onChange={(event) => setOpponentChatDraft(event.target.value)}
                      placeholder={opponentChatEnabled ? t("avatarPage.battle.battleChatPlaceholder") : t("avatarPage.battle.matchmakingWait")}
                      disabled={!opponentChatEnabled || sendingOpponentChat}
                    />
                    <button
                      type="submit"
                      disabled={!opponentChatEnabled || !opponentChatDraft.trim() || sendingOpponentChat}
                    >
                      {sendingOpponentChat ? t("avatarPage.battle.sending") : t("avatarPage.battle.send")}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <div className="mobile-chat-log">
                    {globalChatMessages.map((message) => (
                      <p key={message.id} className="battle-chat__item">
                        <span className="battle-chat__author">
                          {message.author}
                          {message.isSelf ? t("avatarPage.battle.selfSuffix") : ""}
                        </span>
                        <span className="battle-chat__text">{message.text}</span>
                      </p>
                    ))}
                    {!globalChatMessages.length && (
                      <p className="battle-chat__hint">{t("avatarPage.battle.globalChatEmpty")}</p>
                    )}
                  </div>
                  <form className="battle-chat__form" onSubmit={handleSendGlobalChat}>
                    <input
                      type="text"
                      value={globalChatDraft}
                      onChange={(event) => setGlobalChatDraft(event.target.value)}
                      placeholder={t("avatarPage.battle.globalChatPlaceholder")}
                      disabled={sendingGlobalChat}
                    />
                    <button type="submit" disabled={!globalChatDraft.trim() || sendingGlobalChat}>
                      {sendingGlobalChat ? t("avatarPage.battle.sending") : t("avatarPage.battle.send")}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {desktopChatFabVisible && (
        <button
          type="button"
          className={`desktop-chat-fab ${desktopChatOpen ? "desktop-chat-fab--open" : ""}`}
          onClick={() => setDesktopChatOpen((previous) => !previous)}
          aria-label={t("avatarPage.battle.mobileChatTitle")}
          aria-expanded={desktopChatOpen}
        >
          <MessageCircle size={18} />
          <span>{t("avatarPage.battle.battleChatTitle")}</span>
        </button>
      )}

      {desktopChatFabVisible && desktopChatOpen && (
        <div className="desktop-chat-panel" role="dialog" aria-modal="false">
          <div className="desktop-chat-panel__header">
            <div>
              <p className="desktop-chat-panel__eyebrow">{t("avatarPage.battle.mobileChatTitle")}</p>
              <p className="desktop-chat-panel__title">{t("avatarPage.battle.battleChatTitle")}</p>
            </div>
            <button
              type="button"
              className="desktop-chat-close"
              onClick={() => setDesktopChatOpen(false)}
              aria-label={t("common.close")}
            >
              <X size={18} />
            </button>
          </div>
          <div className="desktop-chat-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              className={desktopChatTab === "battle" ? "active" : ""}
              onClick={() => setDesktopChatTab("battle")}
            >
              {t("avatarPage.battle.battleChatTitle")}
            </button>
            <button
              type="button"
              role="tab"
              className={desktopChatTab === "global" ? "active" : ""}
              onClick={() => setDesktopChatTab("global")}
            >
              {t("avatarPage.battle.globalChatTitle")}
            </button>
          </div>
          <div className="desktop-chat-body">
            {desktopChatTab === "battle" ? (
              <>
                <div className="desktop-chat-log">
                  {opponentChatMessages.map((message) => (
                    <p key={message.id} className="battle-chat__item">
                      <span className="battle-chat__author">
                        {message.author}
                        {message.isSelf ? t("avatarPage.battle.selfSuffix") : ""}
                      </span>
                      <span className="battle-chat__text">{message.text}</span>
                    </p>
                  ))}
                  {!opponentChatMessages.length && (
                    <p className="battle-chat__hint">{t("avatarPage.battle.battleChatEmpty")}</p>
                  )}
                </div>
                <form className="desktop-chat-form" onSubmit={handleSendOpponentChat}>
                  <input
                    type="text"
                    value={opponentChatDraft}
                    onChange={(event) => setOpponentChatDraft(event.target.value)}
                    placeholder={opponentChatEnabled ? t("avatarPage.battle.battleChatPlaceholder") : t("avatarPage.battle.matchmakingWait")}
                    disabled={!opponentChatEnabled || sendingOpponentChat}
                  />
                  <button type="submit" disabled={!opponentChatEnabled || !opponentChatDraft.trim() || sendingOpponentChat}>
                    {sendingOpponentChat ? t("avatarPage.battle.sending") : t("avatarPage.battle.send")}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="desktop-chat-log">
                  {globalChatMessages.map((message) => (
                    <p key={message.id} className="battle-chat__item">
                      <span className="battle-chat__author">
                        {message.author}
                        {message.isSelf ? t("avatarPage.battle.selfSuffix") : ""}
                      </span>
                      <span className="battle-chat__text">{message.text}</span>
                    </p>
                  ))}
                  {!globalChatMessages.length && (
                    <p className="battle-chat__hint">{t("avatarPage.battle.globalChatEmpty")}</p>
                  )}
                </div>
                <form className="desktop-chat-form" onSubmit={handleSendGlobalChat}>
                  <input
                    type="text"
                    value={globalChatDraft}
                    onChange={(event) => setGlobalChatDraft(event.target.value)}
                    placeholder={t("avatarPage.battle.globalChatPlaceholder")}
                    disabled={sendingGlobalChat}
                  />
                  <button type="submit" disabled={!globalChatDraft.trim() || sendingGlobalChat}>
                    {sendingGlobalChat ? t("avatarPage.battle.sending") : t("avatarPage.battle.send")}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function OwnerLockedNotice({ tab }: { tab: AvatarTab }) {
  const t = useTranslations();
  const tabLabels: Record<AvatarTab, string> = {
    battle: t("hud.avatarTabs.battle"),
    market: t("hud.avatarTabs.market"),
    designer: t("hud.avatarTabs.designer"),
    ranking: t("hud.avatarTabs.ranking"),
  };

  return (
    <section className="rounded-3xl border border-white/10 bg-[#050a16]/70 p-8 text-center text-white">
      <p className="text-2xl font-semibold">{t("avatarPage.ownerNotice.title")}</p>
      <p className="mt-3 text-sm text-slate-300">
        {t("avatarPage.ownerNotice.description").replace("{tab}", tabLabels[tab])}
      </p>
    </section>
  );
}

function BattleSpriteFigure({ sprite, orientation }: { sprite: PixelSprite; orientation: "player" | "opponent" }) {
  return (
    <PixelPreview
      sprite={sprite}
      size="lg"
      framed={false}
      className={`pixel-stack ${orientation === "opponent" ? "pixel-stack-opponent" : ""}`}
      style={{ width: 140 }}
    />
  );
}

interface ModalProps {
  title: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}

function Modal({ title, closeLabel, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl rounded-[32px] border border-white/10 bg-[#040611]/90 p-6 shadow-[0_25px_120px_rgba(0,0,0,0.85)]">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold uppercase tracking-[0.3em] text-white/80">{title}</h3>
          <button
            type="button"
            className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70"
            onClick={onClose}
          >
            {closeLabel}
          </button>
        </div>
        <div className="mt-5 space-y-3">{children}</div>
      </div>
    </div>
  );
}

async function fetchJson<T>(route: string): Promise<T | null> {
  try {
    const response = await fetch(route, { cache: "no-store" });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
