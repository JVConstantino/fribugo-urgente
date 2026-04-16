import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  login as loginService,
  logout as logoutService,
  getCurrentUser,
  isAdmin as isAdminService,
} from "@/services/appwrite";
import type { User } from "@/types";

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [adminStatus, setAdminStatus] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);

      if (currentUser) {
        const admin = await isAdminService();
        setAdminStatus(admin);
      } else {
        setAdminStatus(false);
      }
    } catch {
      setUser(null);
      setAdminStatus(false);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      await loginService(email, password);
      await refreshUser();
    },
    [refreshUser]
  );

  const logout = useCallback(async () => {
    await logoutService();
    setUser(null);
    setAdminStatus(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: adminStatus,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
