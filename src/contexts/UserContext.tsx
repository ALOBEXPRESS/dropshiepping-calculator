import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/contexts/SettingsContext';
import type { UserRole } from '@/hooks/useUserRole';

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  avatar_url: string | null;
}

interface UserContextType {
  userId: string | null;
  email: string | null;
  role: UserRole;
  isAdmin: boolean;
  roleLoading: boolean;
  profile: UserProfile | null;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  userId: null,
  email: null,
  role: null,
  isAdmin: false,
  roleLoading: true,
  profile: null,
  refreshProfile: async () => {},
});

export const useUser = () => useContext(UserContext);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { organizationId, loading: settingsLoading } = useSettings();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchRole = useCallback(async (uid: string, orgId: string) => {
    try {
      const { data } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', uid)
        .maybeSingle();
      setRole((data?.role as UserRole) ?? 'member');
    } catch {
      setRole('member');
    } finally {
      setLoadedKey(`${uid}:${orgId}`);
    }
  }, []);

  const fetchProfile = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', uid)
      .maybeSingle();
    setProfile(data as UserProfile | null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (userId) await fetchProfile(userId);
  }, [userId, fetchProfile]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserId(user.id);
        setEmail(user.email ?? null);
        fetchProfile(user.id);
      }
      setAuthLoading(false);
    }).catch(() => {
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const user = session?.user ?? null;
      setUserId(user?.id ?? null);
      setEmail(user?.email ?? null);
      if (user) {
        fetchProfile(user.id);
      } else {
        setProfile(null);
        setRole(null);
        setLoadedKey(null);
      }
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const targetKey = userId && organizationId ? `${userId}:${organizationId}` : null;

  useEffect(() => {
    if (authLoading || settingsLoading) return;
    if (userId && organizationId) {
      if (loadedKey !== `${userId}:${organizationId}`) {
        fetchRole(userId, organizationId);
      }
    } else {
      setRole(null);
    }
  }, [authLoading, settingsLoading, userId, organizationId, loadedKey, fetchRole]);

  const roleLoading = authLoading || (userId ? (settingsLoading || (targetKey ? loadedKey !== targetKey : false)) : false);

  return (
    <UserContext.Provider value={{
      userId, email, role, isAdmin: role === 'admin',
      roleLoading, profile, refreshProfile,
    }}>
      {children}
    </UserContext.Provider>
  );
};
