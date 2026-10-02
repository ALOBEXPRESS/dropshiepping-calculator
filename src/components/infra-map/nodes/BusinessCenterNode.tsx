import React from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode, MonoLabel, CountryTag } from './BaseNode';
import { PlatformLogo } from '@/components/ui/PlatformLogos';
import type { InfraNodeData } from '@/utils/infraGraphTransform';

export const BusinessCenterNode = React.memo(function BusinessCenterNode({
  data,
}: NodeProps) {
  const nodeData = (data as unknown) as InfraNodeData;
  const platform = nodeData.platform ?? 'tiktok';

  return (
    <BaseNode data={nodeData} nodeType="business_center">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shrink-0">
          <PlatformLogo platform={platform} className="w-4 h-4" colored={false} />
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
      <div className="flex items-center gap-2">
        {nodeData.country && <CountryTag country={nodeData.country} />}
        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/20">
          BC
        </span>
      </div>
    </BaseNode>
  );
});
