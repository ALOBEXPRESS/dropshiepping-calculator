import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ProxiesManager } from '@/components/proxies/ProxiesManager';
import { BrowserProfilesManager } from '@/components/browser-profiles/BrowserProfilesManager';
import { useSettings } from '@/contexts/SettingsContext';
import { usePlatformAccounts } from '@/hooks/usePlatformAccounts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Shield, Compass } from 'lucide-react';

interface ProxiesPageProps {
  defaultTab?: 'proxies' | 'perfis-navegador';
}

const ProxiesPage: React.FC<ProxiesPageProps> = ({ defaultTab }) => {
  const { organizationId } = useSettings();
  const { data: platformAccounts = [] } = usePlatformAccounts();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Determina a aba ativa pela prop, rota atual ou query param
  const activeTab: 'proxies' | 'perfis-navegador' =
    defaultTab ||
    (location.pathname.includes('perfis-navegador') || searchParams.get('tab') === 'perfis-navegador'
      ? 'perfis-navegador'
      : 'proxies');

  const handleTabChange = (val: string) => {
    if (val === 'perfis-navegador') {
      navigate('/perfis-navegador');
    } else {
      navigate('/proxies');
    }
  };

  if (!organizationId) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Selecione uma organização nas configurações para gerenciar proxies e perfis.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Abas Unificadas do Hub de Rede & Navegação */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 h-11 rounded-xl">
            <TabsTrigger
              value="proxies"
              className="text-xs font-semibold px-4 py-2 gap-2 data-[state=active]:bg-orange-500/15 data-[state=active]:text-orange-400 data-[state=active]:border data-[state=active]:border-orange-500/30 rounded-lg transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-orange-400" />
              <span>Proxies</span>
            </TabsTrigger>
            <TabsTrigger
              value="perfis-navegador"
              className="text-xs font-semibold px-4 py-2 gap-2 data-[state=active]:bg-cyan-500/15 data-[state=active]:text-cyan-400 data-[state=active]:border data-[state=active]:border-cyan-500/30 rounded-lg transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Perfis de Navegador</span>
              <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.2 rounded-full font-mono">
                AdsPower
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="proxies" className="mt-0 focus-visible:outline-none">
          <ProxiesManager
            organizationId={organizationId}
            platformAccounts={platformAccounts}
          />
        </TabsContent>

        <TabsContent value="perfis-navegador" className="mt-0 focus-visible:outline-none">
          <BrowserProfilesManager organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProxiesPage;
