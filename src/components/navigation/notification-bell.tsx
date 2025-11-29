"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/cn";
import { useLocale, useTranslations } from "@/lib/i18n/client";

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

export function NotificationBell() {
  const locale = useLocale();
  const t = useTranslations();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  const clearCloseTimeout = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
  };

  const scheduleClose = () => {
    clearCloseTimeout();
    closeTimeout.current = setTimeout(() => setOpen(false), 120);
  };

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let retry: NodeJS.Timeout | null = null;

    const applyPayload = (payload: { notifications: NotificationItem[]; unread: number }) => {
      setNotifications(payload.notifications);
      setUnread(payload.unread);
    };

    const fetchLatest = async () => {
      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as { notifications: NotificationItem[]; unread: number };
        applyPayload(payload);
      } catch (error) {
        console.error("No se pudo sincronizar notificaciones", error);
      }
    };

    const connect = () => {
      eventSource?.close();
      eventSource = new EventSource("/api/notifications/stream");
      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data) as { notifications: NotificationItem[]; unread: number };
          applyPayload(payload);
        } catch (error) {
          console.error("Error al parsear notificaciones", error);
        }
      };
      eventSource.onerror = () => {
        eventSource?.close();
        retry = setTimeout(connect, 5000);
      };
    };

    void fetchLatest();
    connect();

    if (!pollingRef.current) {
      pollingRef.current = setInterval(() => {
        void fetchLatest();
      }, 4000);
    }

    return () => {
      eventSource?.close();
      if (retry) {
        clearTimeout(retry);
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      clearCloseTimeout();
    };
  }, []);

  useEffect(() => {
    if (!open || unread === 0) return;
    void fetch("/api/notifications/ack", { method: "POST" });
  }, [open, unread]);

  const formattedNotifications = useMemo(
    () =>
      notifications.map((item) => ({
        ...item,
        relativeTime: getRelativeTime(item.createdAt),
      })),
    [notifications, getRelativeTime],
  );

  const unreadLabel = unread === 0
    ? t("notifications.upToDate")
    : t("notifications.unreadTemplate").replace("{count}", unread.toString());

  return (
    <div
      className="relative"
      onMouseLeave={() => {
        if (open) {
          scheduleClose();
        }
      }}
      onMouseEnter={() => {
        if (open) {
          clearCloseTimeout();
        }
      }}
    >
      <button
        type="button"
        onClick={() => {
          clearCloseTimeout();
          setOpen((prev) => !prev);
        }}
        className={cn(
          "relative flex items-center justify-center rounded-full border border-cyan-300/30 bg-white/10 p-2 text-cyan-100 shadow-[0_12px_30px_rgba(0,0,0,0.45)] transition hover:border-fuchsia-300/60 hover:bg-white/20",
          open && "border-fuchsia-300/60 bg-white/15",
        )}
        aria-label={t("notifications.ariaLabel")}
        onMouseEnter={() => {
          if (open) {
            clearCloseTimeout();
          }
        }}
        onMouseLeave={() => {
          if (open) {
            scheduleClose();
          }
        }}
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-semibold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-40 mt-3 w-80 rounded-3xl border border-white/20 bg-[#06081c]/95 p-4 text-sm text-white shadow-[0_25px_70px_rgba(0,0,0,0.75)] backdrop-blur-xl"
          onMouseEnter={clearCloseTimeout}
          onMouseLeave={scheduleClose}
        >
          <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
            <span>{t("notifications.title")}</span>
            <span>{unreadLabel}</span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {formattedNotifications.length === 0 && <p className="text-center text-xs text-slate-400">{t("notifications.empty")}</p>}
            {formattedNotifications.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                <p className="text-white/90">{item.message}</p>
                <div className="mt-1 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-white/50">
                  <span>@{item.actor.username ?? "anon"}</span>
                  <span>{item.relativeTime}</span>
                </div>
                {item.article && (
                  <Link
                    href={`/articles/${item.article.id}`}
                    className="mt-2 inline-flex text-xs font-semibold text-sky-300 hover:text-sky-200"
                    onClick={() => setOpen(false)}
                  >
                    {t("notifications.viewArticle")}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
