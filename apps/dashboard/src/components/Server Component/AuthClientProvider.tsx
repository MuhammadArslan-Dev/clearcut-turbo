'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { clearAuthToken } from '@/lib/auth-token-client';
import { UserPreview } from '@/types/User';

type AuthContextType = {
  user: UserPreview | null;
  loading: boolean;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false,
  logout: async () => {},
});

export function AuthClientProvider({
  children,
  initialUser,
}: {
  children: ReactNode;
  initialUser: UserPreview | null;
}) {
  const [user, setUser] = useState<UserPreview | null>(initialUser);
  const router = useRouter();

  const logout = async () => {
    clearAuthToken();
    setUser(null);
    router.push('/sign-in');
  };

  return (
    <AuthContext.Provider value={{ user, loading: false, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
