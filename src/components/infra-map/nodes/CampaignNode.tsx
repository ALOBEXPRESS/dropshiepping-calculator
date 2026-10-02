import React from 'react';
import type { NodeProps } from '@xyflow/react';
import { Megaphone } from 'lucide-react';
import { BaseNode, StatusBadge } from './BaseNode';
import type { InfraNodeData } from '@/utils/infraGraphTransform';

export const CampaignNode = React.memo(function CampaignNode({ data }: NodeProps) {
  const nodeData = (data as unknown) as InfraNodeData;
  const budgetAmount = nodeData.meta?.budget_amount as number | undefined;
  const budgetType = nodeData.meta?.budget_type as string | undefined;

  return (
    <BaseNode data={nodeData} nodeType="campaign">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-8 h-8 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center shrink-0">
          <Megaphone className="w-4 h-4 text-[#22C55E]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-zinc-100 truncate leading-tight">
            {nodeData.label}
          </p>
          {budgetAmount != null && (
            <span className="text-[10px] text-zinc-500">
              {budgetType === 'daily' ? 'Diário' : 'Total'}: R${' '}
              {budgetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
      </div>
      {nodeData.status && <StatusBadge status={nodeData.status} />}
    </BaseNode>
  );
});
