import React, { useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { ProxyProviderNode } from './nodes/ProxyProviderNode';
import { ProxyNode } from './nodes/ProxyNode';
import { PlatformAccountNode } from './nodes/PlatformAccountNode';
import { BrowserProfileNode } from './nodes/BrowserProfileNode';
import { DeviceNode } from './nodes/DeviceNode';
import { BusinessCenterNode } from './nodes/BusinessCenterNode';
import { AdAccountNode } from './nodes/AdAccountNode';
import { CampaignNode } from './nodes/CampaignNode';
import { TitularNode } from './nodes/TitularNode';
import { NODE_COLORS } from '@/utils/infraGraphTransform';
import type { InfraNodeType } from '@/types/infraGraph';

const nodeTypes = {
  proxy_provider: ProxyProviderNode,
  proxy: ProxyNode,
  platform_account: PlatformAccountNode,
  browser_profile: BrowserProfileNode,
  device: DeviceNode,
  business_center: BusinessCenterNode,
  ad_account: AdAccountNode,
  campaign: CampaignNode,
  titular: TitularNode,
};

interface InfraMapCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
}

export const InfraMapCanvas: React.FC<InfraMapCanvasProps> = ({
  nodes,
  edges,
  onNodeClick,
  onPaneClick,
}) => {
  const { fitView } = useReactFlow();

  // Automatically fit view when nodes are first loaded or layout changes
  useEffect(() => {
    if (nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({
          padding: 0.15,
          includeHiddenNodes: false,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, fitView]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#090a0d]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{
          padding: 0.15,
          includeHiddenNodes: false,
        }}
        minZoom={0.05}
        maxZoom={2.5}
        defaultEdgeOptions={{
          animated: false,
          style: { strokeWidth: 1.5 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        {/* Subtle grid dots background */}
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.2}
          color="rgba(255, 255, 255, 0.08)"
          className="bg-[#090a0d]"
        />

        {/* Floating Zoom & Pan Controls */}
        <Controls
          showZoom
          showFitView
          showInteractive
          position="bottom-left"
          className="!mb-14 !ml-2 bg-card/90 backdrop-blur-md border border-border/80 text-foreground rounded-lg shadow-xl overflow-hidden [&>button]:!bg-transparent [&>button]:!border-border/60 [&>button]:!fill-foreground [&>button:hover]:!bg-accent"
        />

        {/* High-tech MiniMap */}
        <MiniMap
          nodeColor={(node) => {
            const type = node.type as InfraNodeType;
            return NODE_COLORS[type] || '#6B7280';
          }}
          maskColor="rgba(0, 0, 0, 0.6)"
          position="bottom-right"
          className="!m-4 !w-44 !h-32 bg-card/90 backdrop-blur-md border border-border/80 rounded-xl shadow-2xl overflow-hidden"
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
};
