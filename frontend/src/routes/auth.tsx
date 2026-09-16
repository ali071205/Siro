import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/auth')({
  component: AuthComponent,
  validateSearch: (search: Record<string, unknown>) => ({
    code: search.code as string | undefined,
    error: search.error as string | undefined,
    error_description: search.error_description as string | undefined,
  }),
});

function AuthComponent() {
  const navigate = useNavigate();

  useEffect(() => {
    // Login disabled in demo: redirect directly to dashboard
    navigate({ to: '/dashboard' });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="text-center space-y-2">
        <div className="inline-block w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-mono text-cyan-400">Demo Mode Active</p>
        <p className="text-white/60 text-sm">Redirecting to Dashboard...</p>
      </div>
    </div>
  );
}
