import React, { createContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { GetUserById, Logout } from "../services/https";
import type { UserInterface } from "../interfaces/User";
import { getRemainingMs } from "../utils/jwt";
import { authEvents } from "../services/authEvents";

type UserContextType = {
  user: UserInterface | null;
  loading: boolean;
  refetchUser: () => void;
  logout: () => void;
};

export const UserContext = createContext<UserContextType>({
  user: null, loading: true, refetchUser: () => {}, logout: () => {},
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInterface | null>(null);
  const [loading, setLoading] = useState(true);

  // ---- LOGOUT (stable, กันยิงซ้ำ)
  const isLoggingOutRef = useRef(false);
  const emailRef = useRef<string | null>(null);
  useEffect(() => { emailRef.current = user?.Email ?? null; }, [user?.Email]);

  const logout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;
    try {
      const email = emailRef.current || localStorage.getItem("email") || undefined;
      if (email) await Logout(email);
    } catch (e) { console.error("Logout API failed", e); }

    localStorage.removeItem("id");
    localStorage.removeItem("token");
    localStorage.removeItem("token_type");
    localStorage.removeItem("roleId");
    localStorage.removeItem("isLogin");

    setUser(null);
    isLoggingOutRef.current = false;
  }, []);

  // ---- TIMER สำหรับ token exp
  const logoutRef = useRef(() => {});
  useEffect(() => { logoutRef.current = logout; }, [logout]);

  const logoutTimerRef = useRef<number | null>(null);
  const clearLogoutTimer = () => {
    if (logoutTimerRef.current) {
      window.clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
  };

  const scheduleAutoLogout = useCallback(() => {
    clearLogoutTimer();
    const token = localStorage.getItem("token");
    if (!token) return;
    const remain = getRemainingMs(token);
    if (remain == null) return;
    if (remain <= 0) logoutRef.current();
    else logoutTimerRef.current = window.setTimeout(() => logoutRef.current(), remain + 1000);
  }, []);

  // ---- โหลด user ครั้งแรก
  const fetchUser = useCallback(async () => {
    const userIdStr = localStorage.getItem("id");
    if (!userIdStr || isNaN(Number(userIdStr))) { setUser(null); setLoading(false); return; }
    try {
      setLoading(true);
      const data = await GetUserById(Number(userIdStr));
      setUser(data);
    } catch { setUser(null); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchUser(); scheduleAutoLogout(); }, [fetchUser, scheduleAutoLogout]);

  // token ใหม่หลัง login → รีเฟทช์ทันที (ไม่ต้องกดรีเฟรชหน้า)
  useEffect(() => {
    const onTokenChanged = () => { fetchUser(); scheduleAutoLogout(); };
    window.addEventListener("token-changed", onTokenChanged);
    return () => window.removeEventListener("token-changed", onTokenChanged);
  }, [fetchUser, scheduleAutoLogout]);

  // ได้ 401/403 จากอินเตอร์เซปเตอร์ → logout
  useEffect(() => {
    const onForceLogout = () => logout();
    authEvents.addEventListener("logout", onForceLogout as EventListener);
    return () => authEvents.removeEventListener("logout", onForceLogout as EventListener);
  }, [logout]);

  return (
    <UserContext.Provider value={{ user, loading, refetchUser: fetchUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};
