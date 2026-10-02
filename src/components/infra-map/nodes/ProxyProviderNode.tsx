import React from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode, MonoLabel } from './BaseNode';
import { ProviderLogo } from '@/components/ui/ProviderLogo';
import type { InfraNodeData } from '@/utils/infraGraphTransform';

export const ProxyProviderNode = React.memo(function ProxyProviderNode({
  data,
}: NodeProps) {
  const nodeData = (data as unknown) as InfraNodeData;
  return (
    <BaseNode data={nodeData} nodeType="proxy_provider">
      <div className="flex items-center gap-2.5">
        <ProviderLogo name={nodeData.label} className="w-8 h-8" size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-zinc-100 truncate leading-tight">
            {nodeData.label}
          </p>
          {nodeData.sublabel && (
            <MonoLabel>{nodeData.sublabel}</MonoLabel>
          )}
        </div>
      </div>
    </BaseNode>
  );
});
