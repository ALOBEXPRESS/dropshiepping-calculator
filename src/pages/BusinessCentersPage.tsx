import React from 'react';
import { BusinessCentersManager } from '@/components/business-centers/BusinessCentersManager';
import { useSettings } from '@/contexts/SettingsContext';

const BusinessCentersPage: React.FC = () => {
  const { organizationId } = useSettings();

  if (!organizationId) {
    return (
      <div className="p-6 text-muted-foreground text-sm">
        Selecione uma organização nas configurações para gerenciar Business Centers.
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <BusinessCentersManager organizationId={organizationId} />
    </div>
  );
};

export default BusinessCentersPage;
