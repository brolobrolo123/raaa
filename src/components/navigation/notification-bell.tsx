"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, Bell, X } from "lucide-react";
import { useLocale, useTranslations } from "@/lib/i18n/client";
import { cn } from "@/lib/cn";

interface NotificationActor {
  username: string | null;
}

interface NotificationArticle {
  id: string;
  title: string;
}
interface NotificationItem {
  id: string;
  message: string;
  createdAt: string;
  readAt: string | null;
  articleId: string | null;
  type: string;
  actor: NotificationActor;
  article: NotificationArticle | null;
}

type NotificationPayload = {
  notifications: NotificationItem[];
  unread: number;
};

type NotificationSubscriber = (payload: NotificationPayload) => void;

const notificationSubscribers = new Set<NotificationSubscriber>();
let sharedNotifications: NotificationPayload = {
  notifications: [],
  unread: 0,
};
let notificationEventSource: EventSource | null = null;
let notificationRetryTimer: number | NodeJS.Timeout | null = null;
let notificationPollingTimer: number | NodeJS.Timeout | null = null;

function publishNotifications(payload: NotificationPayload) {
  sharedNotifications = payload;
  notificationSubscribers.forEach((subscriber) => subscriber(payload));
}

async function fetchLatestNotifications() {
  try {
    const response = await fetch("/api/notifications", { cache: "no-store" });
    if (!response.ok) {
      return;
    }
    const payload = (await response.json()) as NotificationPayload;
    publishNotifications(payload);
  } catch (error) {
    console.error("No se pudo sincronizar notificaciones", error);
  }
}

function startNotificationStream() {
  if (typeof window === "undefined") {
    return;
  }
  if (notificationEventSource) {
    return;
  }
  void fetchLatestNotifications();
  notificationEventSource = new EventSource("/api/notifications/stream");
  notificationEventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as NotificationPayload;
      publishNotifications(payload);
    } catch (error) {
      console.error("Error al parsear notificaciones", error);
    }
  };
  notificationEventSource.onerror = () => {
    notificationEventSource?.close();
    notificationEventSource = null;
    if (notificationRetryTimer) {
      clearTimeout(notificationRetryTimer);
    }
    notificationRetryTimer = window.setTimeout(() => {
      startNotificationStream();
    }, 5000);
  };
  notificationPollingTimer = window.setInterval(() => {
    void fetchLatestNotifications();
  }, 4000);
}

function stopNotificationStream() {
  notificationEventSource?.close();
  notificationEventSource = null;
  if (notificationPollingTimer) {
    clearInterval(notificationPollingTimer);
    notificationPollingTimer = null;
  }
  if (notificationRetryTimer) {
    clearTimeout(notificationRetryTimer);
    notificationRetryTimer = null;
  }
}

function subscribeNotificationStream(subscriber: NotificationSubscriber) {
  notificationSubscribers.add(subscriber);
  subscriber(sharedNotifications);
  if (notificationSubscribers.size === 1) {
    startNotificationStream();
  }
  return () => {
    notificationSubscribers.delete(subscriber);
    if (!notificationSubscribers.size) {
      stopNotificationStream();
    }
  };
}

function useNotificationsStream() {
  const [payload, setPayload] = useState<NotificationPayload>(sharedNotifications);
  useEffect(() => {
    const unsubscribe = subscribeNotificationStream(setPayload);
    return unsubscribe;
  }, []);
  return payload;
}

type NotificationPanelPlacement = "fab" | "header" | "hud";

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
  placement?: NotificationPanelPlacement;
  notifications: NotificationItem[];
  unread: number;
}

export function NotificationsPanel({
  open,
  onClose,
  placement = "fab",
  notifications,
  unread,
}: NotificationsPanelProps) {
  const locale = useLocale();
  const t = useTranslations();

  const formatter = useMemo(() => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }), [locale]);

  const getRelativeTime = useCallback(
    (timestamp: string) => {
      const date = new Date(timestamp);
      const diff = date.getTime() - Date.now();
      const minutes = Math.round(diff / 60000);
      if (Math.abs(minutes) < 60) {
        return formatter.format(minutes, "minute");
      }
      const hours = Math.round(minutes / 60);
      if (Math.abs(hours) < 24) {
        return formatter.format(hours, "hour");
      }
      const days = Math.round(hours / 24);
      return formatter.format(days, "day");
    },
    [formatter],
  );

  useEffect(() => {
    if (!open || unread === 0) return;
    void fetch("/api/notifications/ack", { method: "POST" });
  }, [open, unread]);

  if (!open) {
    return null;
  }

  const formattedNotifications = notifications.map((item) => ({
    ...item,
    relativeTime: getRelativeTime(item.createdAt),
  }));

  const unreadLabel = unread === 0
    ? t("notifications.upToDate")
    : t("notifications.unreadTemplate").replace("{count}", unread.toString());

  const containerClassMap: Record<NotificationPanelPlacement, string> = {
    header: "fixed inset-x-4 top-24 z-50 sm:left-auto sm:right-4 sm:w-80",
    fab: "fixed inset-x-4 bottom-28 z-50 sm:inset-auto sm:bottom-32 sm:right-4 sm:w-96",
    hud: "fixed inset-x-4 bottom-24 z-50 sm:bottom-16 sm:left-1/2 sm:w-[420px] sm:-translate-x-1/2 sm:transform",
  };

  const panelClassMap: Record<NotificationPanelPlacement, string> = {
    header: "rounded-3xl border border-white/20 bg-[#06081c]/95 p-4 text-sm text-white shadow-[0_25px_60px_rgba(5,12,32,0.65)] backdrop-blur-xl",
    fab: "rounded-3xl border border-white/20 bg-[#06081c]/95 p-4 text-sm text-white shadow-[0_25px_70px_rgba(0,0,0,0.75)] backdrop-blur-xl",
    hud: "rounded-3xl border border-white/20 bg-[#06081c]/95 p-4 text-sm text-white shadow-[0_25px_60px_rgba(5,12,32,0.65)] backdrop-blur-xl",
  };

  const containerClasses = containerClassMap[placement];
  const panelClasses = panelClassMap[placement];

  return (
    <div className={containerClasses}>
      <div className={panelClasses} onMouseLeave={onClose}>
        <div className="mb-3 flex items-center justify-between gap-3 text-xs uppercase tracking-[0.3em] text-slate-400">
          <div className="flex flex-col gap-1">
            <span>{t("notifications.title")}</span>
            <span className="text-[10px] tracking-[0.25em] text-slate-500">{unreadLabel}</span>
          </div>
          <button
            type="button"
            aria-label={t("common.close")}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:border-white/40 hover:text-white"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
          {formattedNotifications.length === 0 && <p className="text-center text-xs text-slate-400">{t("notifications.empty")}</p>}
          {formattedNotifications.map((item) => {
            const isModerationAlert = item.type === "MODERATION_ALERT";
            return (
              <div
                key={item.id}
                className={cn(
                  "rounded-2xl border p-3",
                  isModerationAlert ? "border-rose-400/60 bg-rose-500/10" : "border-white/10 bg-white/5",
                )}
              >
                {isModerationAlert && (
                  <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-rose-200">
                    <AlertTriangle className="h-3 w-3 text-rose-300" />
                    <span>{t("notifications.alertLabel")}</span>
                  </div>
                )}
                <p className="text-white/90">{item.message}</p>
                <div className="mt-1 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/50">
                  <span>@{item.actor.username ?? "anon"}</span>
                  <span>{item.relativeTime}</span>
                </div>
                {item.article && (
                  <a
                    href={`/articles/${item.article.id}`}
                    className="mt-2 inline-flex text-xs font-semibold text-sky-300 hover:text-sky-200"
                    onClick={onClose}
                  >
                    {t("notifications.viewArticle")}
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface NotificationBellButtonProps {
  className?: string;
  placement?: NotificationPanelPlacement;
  children?: ReactNode;
  unstyled?: boolean;
}

export function NotificationBellButton({ className, placement = "header", children, unstyled = false }: NotificationBellButtonProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const { notifications, unread } = useNotificationsStream();

  const badgeLabel = unread > 99 ? "99+" : unread.toString();

  return (
    <>
      {open && <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />}
      <NotificationsPanel
        open={open}
        onClose={() => setOpen(false)}
        placement={placement}
        notifications={notifications}
        unread={unread}
      />
      <button
        type="button"
        aria-label={t("notifications.ariaLabel")}
        aria-expanded={open}
        className={cn(
          unstyled
            ? undefined
            : cn(
              "relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/30 bg-white/10 text-cyan-100 shadow-[0_12px_30px_rgba(0,0,0,0.45)] transition hover:border-fuchsia-300/60 hover:bg-white/20",
              open && "border-fuchsia-300/60 bg-white/15",
            ),
          className,
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        {children ?? <Bell className="h-5 w-5" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-white shadow-[0_2px_6px_rgba(0,0,0,0.35)]">
            {badgeLabel}
          </span>
        )}
      </button>
    </>
  );
}
