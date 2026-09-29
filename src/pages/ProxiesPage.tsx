import React from 'react';
import { ProxiesManager } from '@/components/proxies/ProxiesManager';
import { useSettings } from '@/contexts/SettingsContext';
import { usePlatformAccounts } from '@/hooks/usePlatformAccounts';

const ProxiesPage: React.FC = () => {
  const { organizationId } = useSettings();
  const { data: platformAccounts = [] } = usePlatformAccounts();

  if (!organizationId) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Selecione uma organização nas configurações para gerenciar proxies.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <ProxiesManager
        organizationId={organizationId}
        platformAccounts={platformAccounts}
      />
    </div>
  );
};

export default ProxiesPage;
