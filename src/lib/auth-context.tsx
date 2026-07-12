import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { auth, session, type User } from "./api";

type AuthContextValue = {
  user: User | null;

  loading: boolean;

  isAdmin: boolean;

  login: (
    username: string,
    password: string
  ) => Promise<void>;

  register: (
    username: string,
    email: string,
    password: string
  ) => Promise<void>;

  logout: () => Promise<void>;

  refresh: () => Promise<void>;

  refreshUser: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextValue | null>(null);

async function loadUser(): Promise<User | null> {

  try {

    return await auth.me();

  } catch {

    return null;
  }
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {

  const [user, setUser] =
    useState<User | null>(null);

  const [loading, setLoading] =
    useState(true);

  const refresh = useCallback(async () => {

    const u = await loadUser();

    if (u) {

      session.markActive();

    } else {

      session.markEnded();
    }

    setUser(u);

  }, []);

  // Alias for OAuth / future compatibility
  const refreshUser = refresh;

  useEffect(() => {

    let cancelled = false;

    (async () => {

      try {

        const u = await loadUser();

        if (!cancelled) {

          if (u) {

            session.markActive();

          } else {

            session.markEnded();
          }

          setUser(u);
        }

      } finally {

        if (!cancelled) {

          setLoading(false);
        }
      }

    })();

    const off = session.onEnded(() => {

      if (!cancelled) {

        setUser(null);
      }
    });

    return () => {

      cancelled = true;

      off();
    };

  }, []);

  const login = useCallback(
    async (
      username: string,
      password: string
    ) => {

      await auth.login(
        username,
        password
      );

      await refresh();

    },
    [refresh]
  );

  const register = useCallback(
  async (
    username: string,
    email: string,
    password: string
  ) => {
    await auth.register(username, email, password);
    // Immediately log the user in after successful registration
    await auth.login(username, password);
    await refresh();
  },
  [refresh]
);


  const logout = useCallback(async () => {

    try {

      await auth.logout();

    } catch {

      // Ignore network failures
    }

    session.markEnded();

    setUser(null);

  }, []);

  const isAdmin =
    !!user?.role &&
    /admin/i.test(user.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin,
        login,
        register,
        logout,
        refresh,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {

  const ctx =
    useContext(AuthContext);

  if (!ctx) {

    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return ctx;
}
