import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Safe WebSocket: only inject in browser, not SSR
const isBrowser = typeof window !== 'undefined';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
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
