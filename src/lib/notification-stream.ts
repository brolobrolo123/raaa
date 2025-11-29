type NotificationSubscriber = () => Promise<void>;

declare global {
  var __notificationSubscribers: Map<string, Set<NotificationSubscriber>> | undefined;
}

const getSubscriberStore = () => {
  if (!globalThis.__notificationSubscribers) {
    globalThis.__notificationSubscribers = new Map();
  }
  return globalThis.__notificationSubscribers;
};

const subscribers = getSubscriberStore();

export function registerNotificationStream(userId: string, send: NotificationSubscriber) {
  let set = subscribers.get(userId);
  if (!set) {
    set = new Set();
    subscribers.set(userId, set);
  }
  set.add(send);

  const cleanup = () => {
    const current = subscribers.get(userId);
    current?.delete(send);
    if (current && current.size === 0) {
      subscribers.delete(userId);
    }
  };

  return cleanup;
}

export function broadcastNotificationUpdate(userId: string) {
  const set = subscribers.get(userId);
  if (!set) {
    return;
  }

  set.forEach((dispatch) => {
    void dispatch().catch(() => undefined);
  });
}
