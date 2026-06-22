
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
  settingsError: string | null;
  retrySettings: () => void;
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
  settingsError: null,
  retrySettings: () => {},
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
  const [settingsError, setSettingsError] = useState<string | null>(null);

  const isAbortError = (error: unknown) =>
    (error instanceof DOMException && error.name === 'AbortError')
    || (error instanceof Error && error.name === 'AbortError');

  const fetchSettings = useCallback(async () => {
    const controller = new AbortController();
    // Signal available for future use if needed
    // const signal = controller.signal;

    const timeoutId = setTimeout(() => {
      controller.abort();
      setSettingsError('Tempo limite excedido ao carregar configurações.');
      setLoading(false);
    }, 10_000);

    try {
      setLoading(true);
      setSettingsError(null);
      const { data: { user } } = await supabase.auth.getUser();

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
        // If no organization, fetch "Empresa Alob" (fallback/dev mode)
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id')
          .eq('name', 'Empresa Alob')
          .limit(1);
        if (orgs && orgs.length > 0) {
          orgId = orgs[0].id;
        } else {
          // Se não encontrar "Empresa Alob", pega a primeira
          const { data: fallbackOrgs } = await supabase
            .from('organizations')
            .select('id')
            .limit(1);
          if (fallbackOrgs && fallbackOrgs.length > 0) orgId = fallbackOrgs[0].id;
        }
      }

      if (!orgId) {
        setSettingsError('Organização não encontrada.');
        setOrganizationId(null);
        return;
      }

      setOrganizationId(orgId);
      setSettingsError(null);

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
      setLastUpdated(Date.now());
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Error fetching settings:', error);
        setSettingsError('Erro ao conectar ao servidor.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

  const retrySettings = useCallback(() => {
    setSettingsError(null);
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    fetchSettings();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        fetchSettings();
      } else if (event === 'TOKEN_REFRESHED') {
        // Token refresh não precisa re-buscar settings — organizationId já está carregado
        // Re-buscar causaria auto-reload ao trocar de aba (Supabase refresha token no focus)
        setOrganizationId(prev => prev); // no-op, mantém estado
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
      lastUpdated,
      settingsError,
      retrySettings,
    }}>
      {children}
    </SettingsContext.Provider>
  );
};
