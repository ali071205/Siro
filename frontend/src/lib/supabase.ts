import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://demo-phantmos.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbW8tcGhhbnRtb3MiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTAwMDAwMDAwfQ.demo-signature';

// Safe WebSocket: only inject in browser, not SSR
const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  ...(isBrowser && {
    global: {
      // @ts-ignore
      WebSocket: window.WebSocket,
    },
    realtime: {
      // @ts-ignore
      transport: window.WebSocket,
    },
  }),
});
