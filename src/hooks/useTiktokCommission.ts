import { useState, useEffect } from 'react';
import { ReferenceService } from '@/services/referenceService';
import { useSettings } from '@/contexts/SettingsContext';

/**
 * Returns the TikTok Shop commission rate from the marketplaces settings.
 * Falls back to 6% if not configured.
 */
export function useTiktokCommission(): number {
  const { organizationId } = useSettings();
  const [commissionRate, setCommissionRate] = useState<number>(6);

  useEffect(() => {
    if (!organizationId) return;
    ReferenceService.getMarketplaces(organizationId).then((marketplaces) => {
      const tiktok = marketplaces.find((m) => m.name?.toLowerCase() === 'tiktok');
      if (tiktok?.commission_rate != null) {
        setCommissionRate(tiktok.commission_rate);
      }
    }).catch(() => {/* keep default */});
  }, [organizationId]);

  return commissionRate;
}
