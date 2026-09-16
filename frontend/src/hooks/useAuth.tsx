import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  session: any;
  user: any;
  loading: boolean;
  signOut: () => Promise<void>;
}

const mockUser = {
  id: 'demo-user-001',
  email: 'demo@phantmos.ai',
  user_metadata: {
    full_name: 'Alex Rivera',
    avatar_url: '',
  },
};

const mockSession = {
  access_token: 'demo-token',
  user: mockUser,
};

const AuthContext = createContext<AuthContextType>({
  session: mockSession,
  user: mockUser,
  loading: false,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session] = useState<any>(mockSession);
  const [user] = useState<any>(mockUser);
  const [loading] = useState(false);

  const signOut = async () => {
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
