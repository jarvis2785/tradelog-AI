const SESSION_KEY = "tradelog_session";

export function setSession() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ ts: Date.now() }));
}

export function hasSession() {
  if (typeof window === "undefined") return false;
  return !!window.localStorage.getItem(SESSION_KEY);
}

export function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}
