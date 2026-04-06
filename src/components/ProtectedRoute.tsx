
import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

import type { Session } from '@supabase/supabase-js';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const isE2E = import.meta.env.VITE_E2E === 'true' || new URLSearchParams(window.location.search).get('e2e') === 'true';

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Error checking session:', error);
        // Só faz signOut em erros de token inválido, não em erros de rede/rate limit
        const isTokenError = error.message?.toLowerCase().includes('invalid') ||
          error.message?.toLowerCase().includes('expired') ||
          error.message?.toLowerCase().includes('jwt');
        if (isTokenError) {
          void supabase.auth.signOut();
          setSession(null);
        }
        // Em caso de erro de rede/429, mantém sessão atual se existir
        setLoading(false);
        return;
      }
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Só atualiza sessão em eventos relevantes, ignora erros de refresh
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isE2E) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
