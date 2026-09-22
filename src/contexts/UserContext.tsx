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
  const { organizationId } = useSettings();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchRole = useCallback(async (uid: string, orgId: string | null) => {
    if (!orgId) { setRoleLoading(false); return; }
    setRoleLoading(true);
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
      setRoleLoading(false);
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
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      const user = session?.user ?? null;
      setUserId(user?.id ?? null);
      setEmail(user?.email ?? null);
      if (user) fetchProfile(user.id);
      else { setProfile(null); setRole(null); }
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  useEffect(() => {
    if (userId && organizationId) fetchRole(userId, organizationId);
    else if (!organizationId) setRoleLoading(false);
  }, [userId, organizationId, fetchRole]);

  return (
    <UserContext.Provider value={{
      userId, email, role, isAdmin: role === 'admin',
      roleLoading, profile, refreshProfile,
    }}>
      {children}
    </UserContext.Provider>
  );
};
