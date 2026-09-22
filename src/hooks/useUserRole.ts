import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export type UserRole = 'admin' | 'member' | null;

export function useUserRole(organizationId: string | null): {
  role: UserRole;
  isAdmin: boolean;
  loading: boolean;
} {
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!organizationId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || cancelled) return;
        const { data } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', organizationId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (!cancelled) setRole((data?.role as UserRole) ?? 'member');
      } catch {
        if (!cancelled) setRole('member');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [organizationId]);

  return { role, isAdmin: role === 'admin', loading };
}
