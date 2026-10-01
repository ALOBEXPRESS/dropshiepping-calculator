import React from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ProxiesManager } from '@/components/proxies/ProxiesManager';
import { ProxyProvidersManager } from '@/components/proxy-providers/ProxyProvidersManager';
import { DevicesManager } from '@/components/devices/DevicesManager';
import { BrowserProfilesManager } from '@/components/browser-profiles/BrowserProfilesManager';
import { useSettings } from '@/contexts/SettingsContext';
import { usePlatformAccounts } from '@/hooks/usePlatformAccounts';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Shield, Server, Smartphone, Compass } from 'lucide-react';

export type ProxiesTab = 'proxies' | 'provedores' | 'dispositivos' | 'perfis-navegador';

interface ProxiesPageProps {
  defaultTab?: ProxiesTab;
}

const ProxiesPage: React.FC<ProxiesPageProps> = ({ defaultTab }) => {
  const { organizationId } = useSettings();
  const { data: platformAccounts = [] } = usePlatformAccounts();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Determina a aba ativa pela prop, rota atual ou query param
  const currentPath = location.pathname;
  const tabParam = searchParams.get('tab');

  let activeTab: ProxiesTab = 'proxies';
  if (defaultTab) {
    activeTab = defaultTab;
  } else if (tabParam && ['proxies', 'provedores', 'dispositivos', 'perfis-navegador'].includes(tabParam)) {
    activeTab = tabParam as ProxiesTab;
  } else if (currentPath.includes('perfis-navegador') || currentPath.includes('perfis-de-navegador')) {
    activeTab = 'perfis-navegador';
  } else if (currentPath.includes('provedores')) {
    activeTab = 'provedores';
  } else if (currentPath.includes('dispositivos')) {
    activeTab = 'dispositivos';
  }

  const handleTabChange = (val: string) => {
    switch (val) {
      case 'perfis-navegador':
        navigate('/perfis-navegador');
        break;
      case 'provedores':
        navigate('/provedores');
        break;
      case 'dispositivos':
        navigate('/dispositivos');
        break;
      default:
        navigate('/proxies');
        break;
    }
  };

  if (!organizationId) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Selecione uma organização nas configurações para gerenciar proxies, provedores e dispositivos.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Abas Unificadas do Hub de Rede, Dispositivos & Navegação */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <TabsList className="bg-zinc-900 border border-zinc-800 p-1 h-11 rounded-xl flex-wrap gap-1">
            <TabsTrigger
              value="proxies"
              className="text-xs font-semibold px-4 py-2 gap-2 data-[state=active]:bg-orange-500/15 data-[state=active]:text-orange-400 data-[state=active]:border data-[state=active]:border-orange-500/30 rounded-lg transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-orange-400" />
              <span>Proxies</span>
            </TabsTrigger>
            <TabsTrigger
              value="provedores"
              className="text-xs font-semibold px-4 py-2 gap-2 data-[state=active]:bg-amber-500/15 data-[state=active]:text-amber-400 data-[state=active]:border data-[state=active]:border-amber-500/30 rounded-lg transition-all cursor-pointer"
            >
              <Server className="w-3.5 h-3.5 text-amber-400" />
              <span>Provedores</span>
            </TabsTrigger>
            <TabsTrigger
              value="dispositivos"
              className="text-xs font-semibold px-4 py-2 gap-2 data-[state=active]:bg-emerald-500/15 data-[state=active]:text-emerald-400 data-[state=active]:border data-[state=active]:border-emerald-500/30 rounded-lg transition-all cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Dispositivos</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-full font-mono">
                Douplus / Emuladores
              </span>
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

        <TabsContent value="provedores" className="mt-0 focus-visible:outline-none">
          <ProxyProvidersManager organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="dispositivos" className="mt-0 focus-visible:outline-none">
          <DevicesManager organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="perfis-navegador" className="mt-0 focus-visible:outline-none">
          <BrowserProfilesManager organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProxiesPage;
