
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface SettingsContextType {
  organizationId: string | null;
  workingCapital: string;
  emergencyReserve: string;
  capitalMarketing: string;
  grossInvestment: string;
  loading: boolean;
  reloadSettings: () => Promise<void>;
  lastUpdated: number;
}

const SettingsContext = createContext<SettingsContextType>({
  organizationId: null,
  workingCapital: '0',
  emergencyReserve: '0',
  capitalMarketing: '0',
  grossInvestment: '0',
  loading: false,
  reloadSettings: async () => {},
  lastUpdated: 0,
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [workingCapital, setWorkingCapital] = useState('0');
  const [emergencyReserve, setEmergencyReserve] = useState('0');
  const [capitalMarketing, setCapitalMarketing] = useState('0');
  const [grossInvestment, setGrossInvestment] = useState('0');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(0);

  const isAbortError = (error: unknown) =>
    (error instanceof DOMException && error.name === 'AbortError')
    || (error instanceof Error && error.name === 'AbortError');

  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      // if (!user) {
      //   setLoading(false);
      //   return;
      // }

      // 1. Try to find an organization for this user
      let orgId = null;
      
      if (user) {
        const { data: members } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .limit(1);

        if (members && members.length > 0) {
          orgId = members[0].organization_id;
        }
      }

      if (!orgId) {
        // If no organization, fetch the first one (fallback/dev mode)
        const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
        if (orgs && orgs.length > 0) orgId = orgs[0].id;
      }

      setOrganizationId(orgId);

      if (orgId) {
        const { data: org } = await supabase
          .from('organizations')
          .select('working_capital, emergency_reserve, capital_marketing, gross_investment')
          .eq('id', orgId)
          .single();

        if (org) {
          setWorkingCapital(org.working_capital?.toString() || '0');
          setEmergencyReserve(org.emergency_reserve?.toString() || '0');
          setCapitalMarketing(org.capital_marketing?.toString() || '0');
          setGrossInvestment(org.gross_investment?.toString() || '0');
        }
      }
      setLastUpdated(Date.now());
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Error fetching settings:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchSettings();
      } else if (event === 'SIGNED_OUT') {
        setOrganizationId(null);
        setWorkingCapital('0');
        setEmergencyReserve('0');
        setCapitalMarketing('0');
      setGrossInvestment('0');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSettings]);

  return (
    <SettingsContext.Provider value={{ 
      organizationId, 
      workingCapital, 
      emergencyReserve, 
      capitalMarketing,
      grossInvestment,
      loading,
      reloadSettings: fetchSettings,
      lastUpdated
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
