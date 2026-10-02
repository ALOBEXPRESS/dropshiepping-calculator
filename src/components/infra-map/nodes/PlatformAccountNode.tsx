import React from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode, CountryTag } from './BaseNode';
import { getSocialPlatformDetails } from '@/components/ui/PlatformLogos';
import type { InfraNodeData } from '@/utils/infraGraphTransform';

export const PlatformAccountNode = React.memo(function PlatformAccountNode({
  data,
}: NodeProps) {
  const nodeData = (data as unknown) as InfraNodeData;
  const platform = nodeData.platform ?? 'tiktok';
  const metaType = nodeData.meta?.meta_account_type as string | undefined;
  const details = getSocialPlatformDetails(platform, metaType ?? null);
  const { Logo, badgeBg, badgeBorder, badgeText } = details;

  return (
    <BaseNode data={nodeData} nodeType="platform_account">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div
          className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${badgeBg} ${badgeBorder}`}
        >
          <Logo className="w-4 h-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-zinc-100 truncate leading-tight">
            {nodeData.label}
          </p>
          {nodeData.sublabel && (
            <span className={`text-[10px] truncate block ${badgeText}`}>
              {nodeData.sublabel}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {nodeData.country && <CountryTag country={nodeData.country} />}
        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${badgeBg} ${badgeText} ${badgeBorder} border`}>
          {details.name}
        </span>
      </div>
    </BaseNode>
  );
});
