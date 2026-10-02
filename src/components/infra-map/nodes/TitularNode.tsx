import React from 'react';
import type { NodeProps } from '@xyflow/react';
import { User } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { InfraNodeData } from '@/utils/infraGraphTransform';

export const TitularNode = React.memo(function TitularNode({ data }: NodeProps) {
  const nodeData = (data as unknown) as InfraNodeData;
  const docType = nodeData.meta?.document_type as string | undefined;

  return (
    <BaseNode data={nodeData} nodeType="titular">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-zinc-700/50 border border-zinc-600/50 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-zinc-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-zinc-100 truncate leading-tight">
            {nodeData.label}
          </p>
          {docType && (
            <span className="text-[10px] text-zinc-500 uppercase font-medium tracking-wider">
              {docType === 'cpf' ? 'CPF ***.***.***-**' : docType.toUpperCase()}
            </span>
          )}
        </div>
      </div>
    </BaseNode>
  );
});
