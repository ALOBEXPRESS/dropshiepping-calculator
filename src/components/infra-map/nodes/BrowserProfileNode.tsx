import React from 'react';
import type { NodeProps } from '@xyflow/react';
import { Globe } from 'lucide-react';
import { BaseNode, MonoLabel, StatusBadge } from './BaseNode';
import type { InfraNodeData } from '@/utils/infraGraphTransform';

const TOOL_LABELS: Record<string, string> = {
  adspower: 'AdsPower',
  multilogin: 'Multilogin',
  gologin: 'GoLogin',
  other: 'Outro',
};

const TOOL_COLORS: Record<string, string> = {
  adspower: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
  multilogin: 'bg-violet-500/10 text-violet-300 border-violet-500/20',
  gologin: 'bg-sky-500/10 text-sky-300 border-sky-500/20',
  other: 'bg-zinc-800 text-zinc-400 border-zinc-700',
};

export const BrowserProfileNode = React.memo(function BrowserProfileNode({
  data,
}: NodeProps) {
  const nodeData = (data as unknown) as InfraNodeData;
  const tool = nodeData.meta?.tool as string | undefined;
  const toolLabel = tool ? (TOOL_LABELS[tool] ?? tool) : null;
  const toolColor = tool ? (TOOL_COLORS[tool] ?? TOOL_COLORS.other) : null;

  return (
    <BaseNode data={nodeData} nodeType="browser_profile">
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className="w-8 h-8 rounded-lg bg-cyan-300/10 border border-cyan-300/20 flex items-center justify-center shrink-0">
          <Globe className="w-4 h-4 text-[#67E8F9]" />
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
        {toolLabel && toolColor && (
          <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded border ${toolColor}`}>
            {toolLabel}
          </span>
        )}
      </div>
    </BaseNode>
  );
});
