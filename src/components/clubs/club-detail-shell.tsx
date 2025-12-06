"use client";

import type { FormEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { Smile, Users, Shield, SendHorizontal, AlertCircle, BarChart3, Loader2 } from "lucide-react";
import { useTranslations } from "@/lib/i18n/client";
import { UserAvatar } from "@/components/user/user-avatar";
import { parsePixelSprite, HEAD_CANVAS } from "@/lib/pixel-avatar";
import { cn } from "@/lib/cn";
import type {
  ClubSummary,
  ClubModeratorProfile,
  ClubMessageView,
  ClubViewerState,
  ClubPollView,
} from "@/lib/club-service";

interface ClubDetailShellProps {
  club: ClubSummary;
  memberCount: number;
  moderators: ClubModeratorProfile[];
  messages: ClubMessageView[];
  polls: ClubPollView[];
  viewer: ClubViewerState & {
    userId: string;
    username?: string | null;
    image?: string | null;
    points: number;
  };
}

const MODERATION_DURATIONS = [
  { label: "15 min", value: 15 },
  { label: "1 hora", value: 60 },
  { label: "24 h", value: 1440 },
];

const EMOJI_CHOICES = [
  "😀",
  "😁",
  "😂",
  "🤣",
  "😊",
  "😎",
  "😍",
  "😇",
  "🥳",
  "🤩",
  "🤔",
  "😴",
  "😮",
  "😢",
  "😭",
  "😡",
  "🤯",
  "🙌",
  "👏",
  "👍",
  "🔥",
  "✨",
  "🌟",
  "💫",
  "🎯",
] as const;

const POLL_MIN_OPTIONS = 2;
const POLL_MAX_OPTIONS = 5;
const POLL_DURATION_OPTIONS = [15, 30, 60, 180, 1440];

function areMessagesEqual(current: ClubMessageView[], next: ClubMessageView[]) {
  if (current.length !== next.length) {
    return false;
  }
  for (let index = 0; index < current.length; index += 1) {
    if (current[index].id !== next[index].id || current[index].createdAt !== next[index].createdAt) {
      return false;
    }
  }
  return true;
}

export function ClubDetailShell({ club, memberCount, moderators, messages, polls, viewer }: ClubDetailShellProps) {
  const t = useTranslations();
  const [viewerState, setViewerState] = useState(viewer);
  const [memberCounter, setMemberCounter] = useState(memberCount);
  const [chatMessages, setChatMessages] = useState<ClubMessageView[]>(messages);
  const [pollsState, setPolls] = useState<ClubPollView[]>(polls);
  const [composerValue, setComposerValue] = useState("");
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);
  const [composerStatus, setComposerStatus] = useState<string | null>(null);
  const [streamError, setStreamError] = useState(false);
  const [moderationStatus, setModerationStatus] = useState<string | null>(null);
  const [moderatorModalOpen, setModeratorModalOpen] = useState(false);
  const [moderatorModalStatus, setModeratorModalStatus] = useState<string | null>(null);
  const [isPollModalOpen, setPollModalOpen] = useState(false);
  const [pollModalStatus, setPollModalStatus] = useState<string | null>(null);
  const [votingPollId, setVotingPollId] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [isEmojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const canManagePolls = viewerState.membershipRole === "OWNER" || viewerState.membershipRole === "MODERATOR";
  const canVoteInPolls = viewerState.isMember && !viewerState.isBanned && !viewerState.suspendedUntil;

  useEffect(() => {
    if (viewerState.isBanned) {
      return;
    }
    const source = new EventSource(`/api/clubs/${club.slug}/chat/stream`);
    eventSourceRef.current = source;
    source.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          messages: ClubMessageView[];
          polls?: ClubPollView[];
        };
        setChatMessages(payload.messages);
        if (payload.polls) {
          setPolls(payload.polls);
        }
        setStreamError(false);
      } catch (error) {
        console.error("Failed to parse club chat payload", error);
      }
    };
    source.onerror = () => {
      setStreamError(true);
      source.close();
    };
    return () => {
      source.close();
      eventSourceRef.current = null;
    };
  }, [club.slug, viewerState.isBanned]);

  useEffect(() => {
    if (viewerState.isBanned) {
      return undefined;
    }
    let cancelled = false;

    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/clubs/${club.slug}/chat`, { cache: "no-store" });
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as { messages?: ClubMessageView[]; polls?: ClubPollView[] };
        const nextMessages = payload.messages;
        if (cancelled || !nextMessages) {
          return;
        }
        setChatMessages((previous) => (areMessagesEqual(previous, nextMessages) ? previous : nextMessages));
        if (payload.polls) {
          setPolls(payload.polls);
        }
        setStreamError(false);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Club chat polling failed", error);
        }
      }
    };

    fetchMessages();
    const intervalId = window.setInterval(fetchMessages, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [club.slug, viewerState.isBanned]);

  useEffect(() => {
    if (!isEmojiPickerOpen) {
      return undefined;
    }
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(target)
      ) {
        setEmojiPickerOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEmojiPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isEmojiPickerOpen]);

  useEffect(() => {
    const node = chatScrollRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [chatMessages]);

  const formattedMessages = useMemo(() => {
    const formatter = new Intl.DateTimeFormat("es-ES", {
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
    });
    return chatMessages.map((message) => ({
      ...message,
      formattedTimestamp: formatter.format(new Date(message.createdAt)),
    }));
  }, [chatMessages]);

  const restrictions: string[] = [];
  if (viewerState.isBanned) {
    restrictions.push("Has sido baneado de este club.");
  } else {
    if (viewerState.suspendedUntil) {
      restrictions.push(`Suspendido hasta ${new Date(viewerState.suspendedUntil).toLocaleString()}`);
    }
    if (viewerState.mutedUntil) {
      restrictions.push(`Silenciado hasta ${new Date(viewerState.mutedUntil).toLocaleString()}`);
    }
  }

  const sendDisabled = !viewerState.canChat || !composerValue.trim();
  const pollLabels = {
    votesSuffix: t("hub.clubsDetail.pollsVotesLabel"),
    endsLabel: t("hub.clubsDetail.pollsEndsLabel"),
    noExpiryLabel: t("hub.clubsDetail.pollsNoExpiryLabel"),
    createdByLabel: t("hub.clubsDetail.pollsCreatedByLabel"),
    selectedTag: t("hub.clubsDetail.pollsSelectedTag"),
    voteCta: t("hub.clubsDetail.pollsVoteCta"),
  };

  async function handleJoin() {
    setMembershipStatus("Un momento...");
    try {
      const response = await fetch(`/api/clubs/${club.slug}/join`, { method: "POST" });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error ?? "No se pudo unir al club");
      }
      setViewerState((prev) => ({
        ...prev,
        isMember: true,
        membershipRole: prev.membershipRole ?? "MEMBER",
        canChat: !prev.mutedUntil && !prev.suspendedUntil && !prev.isBanned,
      }));
      setMemberCounter((count) => count + 1);
      setMembershipStatus(null);
    } catch (error) {
      setMembershipStatus((error as Error).message);
    }
  }

  async function handleLeave() {
    setMembershipStatus("Un momento...");
    try {
      const response = await fetch(`/api/clubs/${club.slug}/leave`, { method: "POST" });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error ?? "No se pudo salir del club");
      }
      setViewerState((prev) => ({
        ...prev,
        isMember: false,
        membershipRole: null,
        canChat: false,
      }));
      setMemberCounter((count) => Math.max(0, count - 1));
      setMembershipStatus(null);
    } catch (error) {
      setMembershipStatus((error as Error).message);
    }
  }

  async function handleSendMessage() {
    if (!viewerState.canChat || !composerValue.trim()) {
      return;
    }
    const payload = { body: composerValue.trim() };
    setComposerStatus("Enviando...");
    try {
      const response = await fetch(`/api/clubs/${club.slug}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error ?? "No se pudo enviar el mensaje");
      }
      setComposerValue("");
      setEmojiPickerOpen(false);
      setComposerStatus(null);
    } catch (error) {
      setComposerStatus((error as Error).message);
    }
  }

  const handleComposerKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setComposerValue((previous) => `${previous}${emoji}`);
    setEmojiPickerOpen(false);
  };

  async function handleModeration(action: "ban" | "silence" | "suspend", targetUserId: string, durationMinutes?: number) {
    setModerationStatus("Procesando...");
    try {
      const response = await fetch(`/api/clubs/${club.slug}/moderation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId, action, durationMinutes }),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error ?? "No se pudo aplicar la acción");
      }
      setModerationStatus("Acción aplicada correctamente");
      setTimeout(() => setModerationStatus(null), 2000);
    } catch (error) {
      setModerationStatus((error as Error).message);
    }
  }

  const canSeeModeratorCTA = viewerState.membershipRole !== "MODERATOR" && viewerState.membershipRole !== "OWNER";
  const canRequestModerator =
    canSeeModeratorCTA &&
    viewerState.isMember &&
    !viewerState.isBanned &&
    !viewerState.suspendedUntil &&
    viewer.points >= 100 &&
    viewerState.moderatorRequestStatus !== "PENDING";

  async function submitModeratorRequest(form: { discord: string; motivation: string }) {
    setModeratorModalStatus("Enviando...");
    try {
      const response = await fetch(`/api/clubs/${club.slug}/moderator-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.error ?? "No se pudo enviar la solicitud");
      }
      setViewerState((prev) => ({ ...prev, moderatorRequestStatus: "PENDING" }));
      setModeratorModalStatus("Solicitud enviada. Un administrador la revisará.");
      setTimeout(() => {
        setModeratorModalOpen(false);
        setModeratorModalStatus(null);
      }, 1200);
    } catch (error) {
      setModeratorModalStatus((error as Error).message);
    }
  }

  const refreshPollSnapshot = async () => {
    try {
      const response = await fetch(`/api/clubs/${club.slug}/polls`, { cache: "no-store" });
      if (!response.ok) {
        return;
      }
      const payload = (await response.json()) as { polls?: ClubPollView[] };
      if (payload.polls) {
        setPolls(payload.polls);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("No se pudieron refrescar las encuestas", error);
      }
    }
  };

  async function handleCreatePoll(form: { question: string; options: string[]; durationMinutes: number }) {
    setPollModalStatus(t("hub.clubsDetail.pollsModalPublishing"));
    try {
      const response = await fetch(`/api/clubs/${club.slug}/polls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json().catch(() => ({}))) as { poll?: ClubPollView; error?: string };
      if (!response.ok) {
        throw new Error(payload?.error ?? t("hub.clubsDetail.pollsModalError"));
      }
      if (payload.poll) {
        const createdPoll = payload.poll;
        setPolls((previous) => {
          const filtered = previous.filter((poll) => poll.id !== createdPoll.id);
          return [createdPoll, ...filtered];
        });
      } else {
        await refreshPollSnapshot();
      }
      setPollModalStatus(t("hub.clubsDetail.pollsModalSuccess"));
      setTimeout(() => {
        setPollModalOpen(false);
        setPollModalStatus(null);
      }, 900);
    } catch (error) {
      setPollModalStatus((error as Error).message);
    }
  }

  async function handleVote(pollId: string, optionIndex: number) {
    if (!canVoteInPolls) {
      return;
    }
    setPollError(null);
    setVotingPollId(pollId);
    try {
      const response = await fetch(`/api/clubs/${club.slug}/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ optionIndex }),
      });
      const payload = (await response.json().catch(() => ({}))) as { poll?: ClubPollView; error?: string };
      if (!response.ok) {
        throw new Error(payload?.error ?? t("hub.clubsDetail.pollsVoteError"));
      }
      if (payload.poll) {
        const updatedPoll = payload.poll;
        setPolls((previous) => previous.map((poll) => (poll.id === updatedPoll.id ? updatedPoll : poll)));
      } else {
        await refreshPollSnapshot();
      }
    } catch (error) {
      setPollError((error as Error).message);
    } finally {
      setVotingPollId(null);
    }
  }

  return (
    <section className="space-y-8">
      <div className="rounded-4xl border border-white/15 px-8 py-10 text-white shadow-[0_30px_80px_rgba(2,6,23,0.6)]" style={{ backgroundImage: club.heroGradient }}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-3xl border border-white/20 bg-white/10">
              <Image src={club.icon} alt="" width={64} height={64} className="h-14 w-14 object-contain" />
            </span>
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">{t("hub.clubsDetail.badge")}</p>
              <h1 className="text-3xl font-semibold leading-tight lg:text-4xl">{club.name}</h1>
              <p className="text-sm text-white/80 lg:text-base">{club.description}</p>
              <p className="text-xs text-white/60">{memberCounter} miembros</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 text-sm">
            <div className="inline-flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{viewerState.isMember ? "Eres miembro" : "Aún no te unes"}</span>
            </div>
            <div className="flex flex-wrap gap-3">
              {viewerState.isMember ? (
                <button
                  type="button"
                  onClick={handleLeave}
                  className="inline-flex items-center justify-center rounded-3xl border border-rose-200/60 bg-rose-500/15 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-rose-50 hover:border-rose-200"
                >
                  {t("hub.clubsDetail.leaveButton")}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={viewerState.isBanned || Boolean(viewerState.suspendedUntil)}
                  className={cn(
                    "inline-flex items-center justify-center rounded-3xl border px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] transition",
                    viewerState.isBanned || viewerState.suspendedUntil
                      ? "border-white/25 bg-white/5 text-white/50"
                      : "border-white/30 bg-white/10 text-white hover:border-white/60 hover:bg-white/20",
                  )}
                >
                  {t("hub.clubsDetail.joinButton")}
                </button>
              )}
            </div>
            {membershipStatus && <p className="text-xs text-white/70">{membershipStatus}</p>}
          </div>
        </div>
      </div>

      {restrictions.length > 0 && (
        <div className="rounded-3xl border border-amber-200/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="h-4 w-4" />
            Atención
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-6 text-amber-100/90">
            {restrictions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <div className="space-y-6">
          <div className="rounded-4xl border border-white/10 bg-slate-950/80 p-6 text-white shadow-[0_25px_70px_rgba(2,6,23,0.55)]">
            <header className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">Chat del club</p>
                {streamError && <p className="text-xs text-rose-300">No se pudo conectar al chat en tiempo real.</p>}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {canManagePolls && (
                  <button
                    type="button"
                    onClick={() => {
                      setPollModalStatus(null);
                      setPollModalOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-3xl border border-white/20 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white hover:border-white/40"
                  >
                    <BarChart3 className="h-4 w-4" />
                    {t("hub.clubsDetail.pollsButton")}
                  </button>
                )}
                {moderationStatus && viewerState.canModerate && (
                  <p className="text-xs text-cyan-200">{moderationStatus}</p>
                )}
              </div>
            </header>

            <div className="mt-6">
              <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/5">
                <div ref={chatScrollRef} className="max-h-[520px] space-y-4 overflow-y-auto p-5">
                  {formattedMessages.length === 0 ? (
                    <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white/70">
                      Aún no hay mensajes. Sé el primero en iniciar la conversación.
                    </p>
                  ) : (
                    formattedMessages.map((message) => (
                      <article key={message.id} className="group rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                        <div className="flex items-center gap-3">
                          <ModeratorAvatar
                            canModerate={viewerState.canModerate}
                            targetUserId={message.author.id}
                            targetUsername={message.author.username}
                            disabled={message.author.id === viewerState.userId}
                            onAction={handleModeration}
                          >
                            <UserAvatar image={message.author.image ?? "/avatars/default.svg"} size={40} alt={message.author.username} />
                          </ModeratorAvatar>
                          <div>
                            <p className="text-sm font-semibold text-white">@{message.author.username}</p>
                            <p className="text-xs text-white/60">{message.formattedTimestamp}</p>
                          </div>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-white/90">{message.body}</p>
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-3">
                            {message.attachments.map((attachment) => (
                              <figure key={`${message.id}-${attachment.url}`} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                                <Image src={attachment.url} alt={attachment.alt ?? "Attachment"} width={192} height={128} className="h-32 w-48 object-cover" unoptimized />
                              </figure>
                            ))}
                          </div>
                        )}
                      </article>
                    ))
                  )}
                </div>
                <div className="border-t border-white/10" />
                <div className="space-y-3 p-5">
                  {!viewerState.canChat && (
                    <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">
                      {viewerState.isMember ? "No puedes enviar mensajes por las restricciones actuales." : t("hub.clubsDetail.joinToChat")}
                    </p>
                  )}
                  <textarea
                    value={composerValue}
                    onChange={(event) => setComposerValue(event.target.value)}
                    onKeyDown={handleComposerKeyDown}
                    placeholder={t("hub.clubsDetail.composerPlaceholder")}
                    rows={3}
                    disabled={!viewerState.canChat}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-white placeholder:text-white/40 disabled:cursor-not-allowed disabled:opacity-60"
                  />
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      disabled={sendDisabled}
                      className={cn(
                        "inline-flex flex-1 items-center justify-center gap-2 rounded-3xl border px-5 py-2 text-sm font-semibold uppercase tracking-[0.3em]",
                        !sendDisabled ? "border-cyan-200/70 bg-cyan-500/20" : "border-white/15 bg-white/5 text-white/60",
                      )}
                    >
                      <SendHorizontal className="h-4 w-4" />
                      {t("hub.clubsDetail.sendButton")}
                    </button>
                    <div className="relative">
                      <button
                        type="button"
                        ref={emojiButtonRef}
                        disabled={!viewerState.canChat}
                        onClick={() => setEmojiPickerOpen((previous) => !previous)}
                        className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/5"
                        aria-haspopup="true"
                        aria-expanded={isEmojiPickerOpen}
                        aria-label="Abrir selector de emojis"
                      >
                        <Smile className="h-5 w-5" />
                      </button>
                      {isEmojiPickerOpen && (
                        <div
                          ref={emojiPickerRef}
                          className="absolute bottom-14 right-0 z-10 w-56 rounded-2xl border border-white/15 bg-slate-950/90 p-3 shadow-[0_20px_45px_rgba(2,6,23,0.55)]"
                        >
                          <p className="text-[10px] uppercase tracking-[0.3em] text-white/60">Emojis</p>
                          <div className="mt-2 grid grid-cols-6 gap-2">
                            {EMOJI_CHOICES.map((emoji) => (
                              <button
                                type="button"
                                key={emoji}
                                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl hover:border-white/40"
                                onClick={() => handleEmojiSelect(emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {composerStatus && <p className="text-xs text-white/70">{composerStatus}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-4xl border border-white/10 bg-slate-950/70 p-6 text-white shadow-[0_25px_70px_rgba(2,6,23,0.45)]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-white/60">{t("hub.clubsDetail.pollsHeading")}</p>
              <p className="mt-1 text-sm text-white/70">{t("hub.clubsDetail.pollsDescription")}</p>
            </div>
            {pollError && <p className="mt-4 text-xs text-rose-200">{pollError}</p>}
            {pollsState.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/70">{t("hub.clubsDetail.pollsEmpty")}</p>
            ) : (
              <div className="mt-4 space-y-4">
                {pollsState.map((poll) => (
                  <PollCard
                    key={poll.id}
                    poll={poll}
                    canVote={canVoteInPolls}
                    isVoting={votingPollId === poll.id}
                    onVote={handleVote}
                    labels={pollLabels}
                  />
                ))}
              </div>
            )}
            {!canVoteInPolls && <p className="mt-4 text-xs text-white/60">{t("hub.clubsDetail.pollsJoinHint")}</p>}
          </div>

          <div className="space-y-4 rounded-4xl border border-white/10 bg-slate-900/80 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">{t("hub.clubsDetail.rulesTitle")}</p>
                <p className="text-sm text-white/70">Cumple estas reglas para mantener el club en orden.</p>
              </div>
              {canSeeModeratorCTA ? (
                <button
                  type="button"
                  disabled={!canRequestModerator}
                  onClick={() => setModeratorModalOpen(true)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-3xl border px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em]",
                    canRequestModerator
                      ? "border-emerald-200/60 bg-emerald-500/15 text-emerald-100"
                      : "border-white/15 bg-white/5 text-white/50",
                  )}
                >
                  <Shield className="h-4 w-4" />
                  {viewerState.moderatorRequestStatus === "PENDING" ? "Solicitud enviada" : "Ser moderador"}
                </button>
              ) : (
                <p className="rounded-3xl border border-emerald-200/40 bg-emerald-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100">
                  Ya eres parte del equipo
                </p>
              )}
            </div>
            {canSeeModeratorCTA && (
              <p className="text-xs text-white/60">
                Necesitas 100 puntos del foro. Actualmente tienes {viewer.points} puntos.
              </p>
            )}
            <ol className="list-decimal space-y-3 pl-5 text-sm text-white/80">
              {club.rules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ol>
          </div>

          <div className="space-y-4 rounded-4xl border border-white/10 bg-slate-900/80 p-6">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/60">{t("hub.clubsDetail.moderatorsTitle")}</p>
            {moderators.length === 0 ? (
              <p className="text-sm text-white/70">Aún no hay moderadores asignados.</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {moderators.map((moderator) => (
                  <ClubModeratorCard key={moderator.userId} moderator={moderator} />
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {moderatorModalOpen && (
        <ModeratorRequestModal
          onClose={() => {
            setModeratorModalOpen(false);
            setModeratorModalStatus(null);
          }}
          onSubmit={submitModeratorRequest}
          status={moderatorModalStatus}
        />
      )}

      {isPollModalOpen && canManagePolls && (
        <PollComposeModal
          onClose={() => {
            setPollModalOpen(false);
            setPollModalStatus(null);
          }}
          onSubmit={handleCreatePoll}
          status={pollModalStatus}
          maxOptions={POLL_MAX_OPTIONS}
          durationOptions={POLL_DURATION_OPTIONS}
          labels={{
            title: t("hub.clubsDetail.pollsModalTitle"),
            question: t("hub.clubsDetail.pollsModalQuestion"),
            options: t("hub.clubsDetail.pollsModalOptions"),
            optionPlaceholder: t("hub.clubsDetail.pollsModalOptionPlaceholder"),
            duration: t("hub.clubsDetail.pollsModalDuration"),
            addOption: t("hub.clubsDetail.pollsModalAddOption"),
            publish: t("hub.clubsDetail.pollsModalPublish"),
            cancel: t("hub.clubsDetail.pollsModalCancel"),
            hint: t("hub.clubsDetail.pollsModalHint"),
          }}
        />
      )}
    </section>
  );
}

interface PollCardProps {
  poll: ClubPollView;
  canVote: boolean;
  isVoting: boolean;
  onVote: (pollId: string, optionIndex: number) => Promise<void> | void;
  labels: {
    votesSuffix: string;
    endsLabel: string;
    noExpiryLabel: string;
    createdByLabel: string;
    selectedTag: string;
    voteCta: string;
  };
}

function PollCard({ poll, canVote, isVoting, onVote, labels }: PollCardProps) {
  const totalVotesLabel = `${poll.totalVotes} ${labels.votesSuffix}`;
  const remainingLabel = poll.expiresAt ? formatTimeRemaining(poll.expiresAt) : labels.noExpiryLabel;
  return (
    <article className="space-y-3 rounded-3xl border border-white/10 bg-slate-950/60 p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-white">{poll.question}</p>
        <p className="text-xs text-white/60">
          {labels.createdByLabel} @{poll.createdBy.username}
        </p>
        <div className="flex items-center gap-2 text-xs text-white/60">
          <span>
            {labels.endsLabel} {remainingLabel}
          </span>
          {isVoting && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/60" />}
        </div>
      </div>
      <div className="space-y-2">
        {poll.options.map((option) => {
          const isSelected = poll.viewerVote === option.index;
          return (
            <button
              key={`${poll.id}-${option.index}`}
              type="button"
              onClick={() => onVote(poll.id, option.index)}
              disabled={!canVote || isVoting}
              className={cn(
                "w-full rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-left text-sm text-white transition disabled:cursor-not-allowed",
                isSelected && "border-cyan-200/60 bg-cyan-500/10",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-white/70">
                  {option.votes} · {option.percentage}%
                </span>
              </div>
              <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-cyan-400/60"
                  style={{ width: `${option.percentage}%` }}
                />
              </div>
              <p className="mt-2 text-[10px] uppercase tracking-[0.3em] text-white/50">
                {isSelected ? labels.selectedTag : labels.voteCta}
              </p>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-white/60">{totalVotesLabel}</p>
    </article>
  );
}

interface PollComposeModalProps {
  onClose: () => void;
  onSubmit: (payload: { question: string; options: string[]; durationMinutes: number }) => Promise<void>;
  status: string | null;
  maxOptions: number;
  durationOptions: number[];
  labels: {
    title: string;
    question: string;
    options: string;
    optionPlaceholder: string;
    duration: string;
    addOption: string;
    publish: string;
    cancel: string;
    hint: string;
  };
}

function PollComposeModal({ onClose, onSubmit, status, maxOptions, durationOptions, labels }: PollComposeModalProps) {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [duration, setDuration] = useState(durationOptions[0] ?? 60);
  const [submitting, setSubmitting] = useState(false);

  const sanitizedOptions = options.map((option) => option.trim()).filter((option) => option.length > 0);
  const canSubmit = question.trim().length > 0 && sanitizedOptions.length >= POLL_MIN_OPTIONS;

  const addOption = () => {
    setOptions((previous) => (previous.length >= maxOptions ? previous : [...previous, ""]));
  };

  const handleOptionChange = (index: number, value: string) => {
    setOptions((previous) => previous.map((option, idx) => (idx === index ? value : option)));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    await onSubmit({ question: question.trim(), options: sanitizedOptions, durationMinutes: duration });
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900/90 p-6 text-white shadow-xl">
        <h2 className="text-2xl font-semibold">{labels.title}</h2>
        <p className="mt-2 text-sm text-white/70">{labels.hint}</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm text-white/80">
            {labels.question}
            <input
              type="text"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              maxLength={200}
              className="mt-1 w-full rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-2 text-sm"
              required
            />
          </label>
          <div className="space-y-2">
            <p className="text-sm text-white/80">{labels.options}</p>
            {options.map((option, index) => (
              <input
                key={`option-${index}`}
                type="text"
                value={option}
                onChange={(event) => handleOptionChange(index, event.target.value)}
                maxLength={80}
                className="w-full rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-2 text-sm"
                placeholder={`${labels.optionPlaceholder} ${index + 1}`}
              />
            ))}
            <button
              type="button"
              onClick={addOption}
              disabled={options.length >= maxOptions}
              className="text-xs font-semibold uppercase tracking-[0.3em] text-white/60 disabled:opacity-40"
            >
              {labels.addOption}
            </button>
          </div>
          <label className="block text-sm text-white/80">
            {labels.duration}
            <select
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
              className="mt-1 w-full rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-2 text-sm"
            >
              {durationOptions.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} min
                </option>
              ))}
            </select>
          </label>
          {status && <p className="text-xs text-cyan-200">{status}</p>}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
            >
              {labels.cancel}
            </button>
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl border border-emerald-200/60 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]",
                (!canSubmit || submitting) && "opacity-60",
              )}
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {labels.publish}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function formatTimeRemaining(expiresAt: string) {
  const target = new Date(expiresAt).getTime();
  const now = Date.now();
  const diff = target - now;
  if (diff <= 0) {
    return "0m";
  }
  const minutes = Math.max(1, Math.round(diff / 60000));
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes === 0 ? `${hours}h` : `${hours}h ${remainingMinutes}m`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours === 0 ? `${days}d` : `${days}d ${remainingHours}h`;
}

interface ModeratorAvatarProps {
  children: ReactNode;
  canModerate: boolean;
  targetUserId: string;
  targetUsername: string;
  disabled?: boolean;
  onAction: (action: "ban" | "silence" | "suspend", targetUserId: string, durationMinutes?: number) => Promise<void> | void;
}

function ModeratorAvatar({ children, canModerate, targetUserId, targetUsername, disabled, onAction }: ModeratorAvatarProps) {
  const [duration, setDuration] = useState(MODERATION_DURATIONS[0].value);
  if (!canModerate || disabled) {
    return <div className="relative">{children}</div>;
  }
  return (
    <div className="group relative">
      {children}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
        <div className="pointer-events-auto space-y-2 rounded-2xl border border-white/20 bg-slate-950/95 p-3 text-[11px] text-white">
          <p className="font-semibold">{targetUsername}</p>
          <select
            value={duration}
            onChange={(event) => setDuration(Number(event.target.value))}
            className="w-full rounded-xl border border-white/20 bg-slate-900/80 px-2 py-1 text-xs"
          >
            {MODERATION_DURATIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onAction("ban", targetUserId)}
              className="rounded-full bg-rose-500 px-2 py-1 text-xs font-semibold"
            >
              Banear
            </button>
            <button
              type="button"
              onClick={() => onAction("silence", targetUserId, duration)}
              className="rounded-full bg-amber-500 px-2 py-1 text-xs font-semibold"
            >
              Silenciar
            </button>
            <button
              type="button"
              onClick={() => onAction("suspend", targetUserId, duration)}
              className="rounded-full bg-cyan-500 px-2 py-1 text-xs font-semibold"
            >
              Suspender
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ModeratorRequestModalProps {
  onClose: () => void;
  onSubmit: (payload: { discord: string; motivation: string }) => Promise<void>;
  status: string | null;
}

function ModeratorRequestModal({ onClose, onSubmit, status }: ModeratorRequestModalProps) {
  const [discord, setDiscord] = useState("");
  const [motivation, setMotivation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    await onSubmit({ discord, motivation });
    setSubmitting(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-white/15 bg-slate-900/90 p-6 text-white shadow-xl">
        <h2 className="text-2xl font-semibold">Solicitud de moderador</h2>
        <p className="mt-2 text-sm text-white/70">
          Comparte tu usuario de Discord y cuéntanos por qué quieres moderar este club.
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm text-white/80">
            Discord
            <input
              type="text"
              value={discord}
              onChange={(event) => setDiscord(event.target.value)}
              required
              className="mt-1 w-full rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-2 text-sm"
            />
          </label>
          <label className="block text-sm text-white/80">
            ¿Por qué quieres ser moderador?
            <textarea
              value={motivation}
              onChange={(event) => setMotivation(event.target.value)}
              rows={4}
              required
              className="mt-1 w-full rounded-2xl border border-white/15 bg-slate-950/60 px-4 py-2 text-sm"
            />
          </label>
          {status && <p className="text-xs text-cyan-200">{status}</p>}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-white/20 px-4 py-2 text-xs uppercase tracking-[0.3em]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-2xl border border-emerald-200/60 bg-emerald-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]"
            >
              Enviar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ClubModeratorCardProps {
  moderator: ClubModeratorProfile;
}

function ClubModeratorCard({ moderator }: ClubModeratorCardProps) {
  const sprite = moderator.sprite ? parsePixelSprite(moderator.sprite) : null;
  return (
    <article className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-sm">
      <div className="flex items-center gap-3">
        <UserAvatar image={moderator.image ?? "/avatars/default.svg"} size={44} alt={moderator.username} />
        <div>
          <p className="font-semibold text-white">@{moderator.username}</p>
          <p className="text-xs text-white/60">{moderator.role === "OWNER" ? "Dueño" : "Moderador"}</p>
        </div>
      </div>
      <PixelAvatarHead sprite={sprite} />
    </article>
  );
}

function PixelAvatarHead({ sprite }: { sprite: ReturnType<typeof parsePixelSprite> | null }) {
  if (!sprite) {
    return (
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-center text-xs text-white/50">
        Sin sprite asignado
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-2">
      <div
            className="grid gap-[0.4px]"
            style={{
              gridTemplateColumns: `repeat(${HEAD_CANVAS.cols}, 1fr)`,
              gridTemplateRows: `repeat(${HEAD_CANVAS.rows}, 1fr)`,
              width: "72px",
              height: "72px",
            }}
      >
        {sprite.head.map((color, index) => (
          <span
            key={`head-${index}`}
            className="block"
            style={{
              backgroundColor: color ?? "transparent",
              width: "100%",
              height: "100%",
            }}
          />
        ))}
      </div>
    </div>
  );
}
