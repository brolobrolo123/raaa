type ClubChatSubscriber = () => Promise<void>;

declare global {
  var __clubChatSubscribers: Map<string, Set<ClubChatSubscriber>> | undefined;
}

const getClubChatStore = () => {
  if (!globalThis.__clubChatSubscribers) {
    globalThis.__clubChatSubscribers = new Map();
  }
  return globalThis.__clubChatSubscribers;
};

const clubChatSubscribers = getClubChatStore();

export function registerClubChatStream(clubId: string, send: ClubChatSubscriber) {
  let set = clubChatSubscribers.get(clubId);
  if (!set) {
    set = new Set();
    clubChatSubscribers.set(clubId, set);
  }
  set.add(send);

  const cleanup = () => {
    const current = clubChatSubscribers.get(clubId);
    current?.delete(send);
    if (current && current.size === 0) {
      clubChatSubscribers.delete(clubId);
    }
  };

  return cleanup;
}

export function broadcastClubChatUpdate(clubId: string) {
  const set = clubChatSubscribers.get(clubId);
  if (!set) {
    return;
  }

  set.forEach((dispatch) => {
    void dispatch().catch(() => undefined);
  });
}
