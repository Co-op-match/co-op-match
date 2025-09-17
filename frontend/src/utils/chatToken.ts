// src/utils/chatToken.ts
const KEY = 'chat:token';

export function saveChatToken(t: string) {
  sessionStorage.setItem(KEY, t);
}

export function loadChatToken(): string | null {
  return sessionStorage.getItem(KEY);
}

export function clearChatToken() {
  sessionStorage.removeItem(KEY);
}

export function readRidFromToken(t: string | null): number | null {
  try {
    if (!t) return null;
    const [, payload] = t.split('.');
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof json?.rid === 'number') return json.rid;
    return null;
  } catch {
    return null;
  }
}
