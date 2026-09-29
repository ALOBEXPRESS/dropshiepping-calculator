import React from 'react';
import { BrowserProfilesManager } from '@/components/browser-profiles/BrowserProfilesManager';
import { useSettings } from '@/contexts/SettingsContext';

const BrowserProfilesPage: React.FC = () => {
  const { organizationId } = useSettings();

  if (!organizationId) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Selecione uma organização nas configurações para gerenciar perfis de navegador.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BrowserProfilesManager organizationId={organizationId} />
    </div>
  );
};

export default BrowserProfilesPage;
