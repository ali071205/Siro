import React from 'react';

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  // Demo mode: auth is completely bypassed to allow immediate preview
  return <>{children}</>;
};
