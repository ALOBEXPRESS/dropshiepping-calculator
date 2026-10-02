import React from 'react';
import type { NodeProps } from '@xyflow/react';
import { BaseNode, MonoLabel } from './BaseNode';
import { DeviceLogo } from '@/components/ui/DeviceLogo';
import type { InfraNodeData } from '@/utils/infraGraphTransform';

export const DeviceNode = React.memo(function DeviceNode({ data }: NodeProps) {
  const nodeData = (data as unknown) as InfraNodeData;
  const deviceType = nodeData.meta?.device_type as string | undefined;
  const platform = nodeData.meta?.platform as string | undefined;

  return (
    <BaseNode data={nodeData} nodeType="device">
      <div className="flex items-center gap-2.5">
        <DeviceLogo
          deviceType={deviceType}
          platform={platform}
          label={nodeData.label}
          className="w-8 h-8"
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-semibold text-zinc-100 truncate leading-tight">
            {nodeData.label}
          </p>
          {deviceType && (
            <MonoLabel>{deviceType.replace(/_/g, ' ')}</MonoLabel>
          )}
        </div>
      </div>
    </BaseNode>
  );
});
