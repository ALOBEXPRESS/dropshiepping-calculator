import React from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode, MonoLabel, CountryTag } from './BaseNode';
import { AdAccountStatusBadge } from '@/components/ad-accounts/AdAccountStatusBadge';
import { getPlatformLogo } from '@/components/ui/PlatformLogos';
import type { InfraNodeData } from '@/utils/infraGraphTransform';
import type { AdAccountStatus } from '@/types/adAccounts';

export const AdAccountNode = React.memo(function AdAccountNode({ data }: NodeProps) {
  const nodeData = (data as unknown) as InfraNodeData;
  const platform = nodeData.platform ?? 'tiktok';
  const Logo = getPlatformLogo(platform);
  const status = (nodeData.status ?? 'active') as AdAccountStatus;

  return (
    <BaseNode data={nodeData} nodeType="ad_account">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
          <Logo className="w-4 h-4" colored={false} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-zinc-100 truncate leading-tight">
            {nodeData.label}
          </p>
          {nodeData.sublabel && (
            <MonoLabel>{nodeData.sublabel}</MonoLabel>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <AdAccountStatusBadge status={status} />
        {nodeData.country && <CountryTag country={nodeData.country} />}
      </div>
    </BaseNode>
  );
});
