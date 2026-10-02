import React from 'react';
import type { NodeProps } from '@xyflow/react';
import { Shield } from 'lucide-react';
import { BaseNode, MonoLabel, StatusBadge, CountryTag } from './BaseNode';
import type { InfraNodeData } from '@/utils/infraGraphTransform';

const PROXY_TYPE_LABELS: Record<string, string> = {
  static_residential_isp: 'ISP',
  static_datacenter: 'DC',
  static_mobile: 'Mob',
  rotating_mobile: 'Rot·Mob',
  rotating_residential: 'Rot·Res',
};

export const ProxyNode = React.memo(function ProxyNode({ data }: NodeProps) {
  const nodeData = (data as unknown) as InfraNodeData;
  const proxyType = nodeData.meta?.proxy_type as string | undefined;
  const typeLabel = proxyType ? (PROXY_TYPE_LABELS[proxyType] ?? proxyType) : null;

  return (
    <BaseNode data={nodeData} nodeType="proxy">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-8 h-8 rounded-lg bg-[#FF4D00]/10 border border-[#FF4D00]/30 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-[#FF4D00]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-zinc-100 truncate leading-tight">
            {nodeData.label}
          </p>
          {nodeData.sublabel && <MonoLabel>{nodeData.sublabel}</MonoLabel>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {nodeData.status && <StatusBadge status={nodeData.status} />}
        {nodeData.country && <CountryTag country={nodeData.country} />}
        {typeLabel && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#FF4D00]/10 text-[#FF4D00] border border-[#FF4D00]/20">
            {typeLabel}
          </span>
        )}
      </div>
    </BaseNode>
  );
});
