import React, { useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
  applyNodeChanges,
  type NodeChange,
  type OnNodeDrag,
} from '@xyflow/react';
import type { Node, Edge, Viewport } from '@xyflow/react';
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
import { InfraEdge } from './InfraEdge';
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

const edgeTypes = {
  smoothstep: InfraEdge,
  default: InfraEdge,
};

interface InfraMapCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
  onPaneClick: () => void;
  onNodeDragStop?: OnNodeDrag<Node>;
  onNodeContextMenu?: (event: React.MouseEvent, node: Node) => void;
  savedViewport?: Viewport | null;
  onViewportChange?: (viewport: Viewport) => void;
}

export const InfraMapCanvas: React.FC<InfraMapCanvasProps> = ({
  nodes: inputNodes,
  edges,
  onNodeClick,
  onPaneClick,
  onNodeDragStop,
  onNodeContextMenu,
  savedViewport,
  onViewportChange,
}) => {
  const { fitView, setViewport } = useReactFlow();
  const [nodes, setNodes] = React.useState<Node[]>(inputNodes);
  const lastAppliedVpRef = React.useRef<string | null>(null);
  const fitViewDoneRef = React.useRef(false);

  // Synchronize internal nodes state with external nodes prop
  useEffect(() => {
    setNodes(inputNodes);
  }, [inputNodes]);

  const onNodesChange = React.useCallback((changes: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(changes, nds));
  }, []);

  // Restore saved viewport whenever savedViewport becomes available (e.g. on load or org change)
  useEffect(() => {
    if (
      savedViewport &&
      typeof savedViewport.x === 'number' &&
      typeof savedViewport.y === 'number' &&
      typeof savedViewport.zoom === 'number' &&
      savedViewport.zoom > 0
    ) {
      const vpKey = `${Math.round(savedViewport.x)}_${Math.round(savedViewport.y)}_${savedViewport.zoom.toFixed(3)}`;
      if (lastAppliedVpRef.current !== vpKey) {
        lastAppliedVpRef.current = vpKey;
        // Apply immediately and also once more shortly after to guarantee layout stability
        setViewport(savedViewport, { duration: 0 });
        const timer = setTimeout(() => {
          setViewport(savedViewport, { duration: 0 });
        }, 80);
        return () => clearTimeout(timer);
      }
    } else if (nodes.length > 0 && !savedViewport && !fitViewDoneRef.current) {
      fitViewDoneRef.current = true;
      const timer = setTimeout(() => {
        fitView({
          padding: 0.15,
          includeHiddenNodes: false,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes.length, savedViewport, setViewport, fitView]);

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#090a0d]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onNodeContextMenu={
          onNodeContextMenu
            ? (event, node) => {
                event.preventDefault();
                onNodeContextMenu(event, node);
              }
            : undefined
        }
        onPaneClick={onPaneClick}
        onMoveEnd={(_event, viewport) => {
          onViewportChange?.(viewport);
        }}
        nodesDraggable={true}
        defaultViewport={savedViewport || undefined}
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
          bgColor="#090a0d"
          maskColor="rgba(9, 10, 13, 0.75)"
          position="bottom-right"
          className="!m-4 !w-44 !h-32 bg-[#090a0d]/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
};
