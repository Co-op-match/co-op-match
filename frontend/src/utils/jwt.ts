export function parseJwt<T = any>(token: string): T | null {
  try {
    const [, payload] = token.split(".");
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64).split("").map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")
    );
    return JSON.parse(json);
  } catch { return null; }
}
export function getRemainingMs(token: string): number | null {
  const p = parseJwt<{ exp?: number }>(token);
  return p?.exp ? p.exp * 1000 - Date.now() : null;
}

export function getExpMs(token: string): number | null {
  const p = parseJwt<{ exp?: number }>(token);
  return p?.exp ? p.exp * 1000 : null; // exp เป็นวินาที -> แปลงเป็น ms
}

