// UserContext.tsx
import React, {
  createContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { GetUserById } from "../services/https";
import type { UserInterface } from "../interfaces/User";
import { Logout } from "../services/https";
type UserContextType = {
  user: UserInterface | null;
  loading: boolean;
  refetchUser: () => void;
  logout: () => void; // เพิ่ม logout
};

export const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  refetchUser: () => {},
  logout: () => {},
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserInterface | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const userIdStr = localStorage.getItem("id");
    if (!userIdStr || isNaN(Number(userIdStr))) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const userData = await GetUserById(Number(userIdStr));
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // ฟังก์ชัน logout
  const logout = async () => {
  try {
    if (user?.Email) {
      await Logout(user.Email); // เรียก API logout พร้อมส่ง email
    }
  } catch (error) {
    console.error("Logout API failed", error);
  }

  localStorage.removeItem("id");
  localStorage.removeItem("token");
  localStorage.removeItem("token_type");
  localStorage.removeItem("roleId");
  localStorage.removeItem("isLogin");

  setUser(null);
};


  return (
    <UserContext.Provider value={{ user, loading, refetchUser: fetchUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};