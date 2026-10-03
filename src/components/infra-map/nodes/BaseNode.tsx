/**
 * BaseNode — shared wrapper for all infra-map node components.
 * Handles highlight/dim state, alert indicator, and consistent
 * border-left accent color per node type.
 *
 * Supports:
 * - nodeSize: 'small' | 'medium' | 'large' (injected via data.nodeSize)
 * - customColor: string | null (per-node color override via data.customColor)
 */
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { InfraNodeData } from '@/utils/infraGraphTransform';
import { NODE_COLORS } from '@/utils/infraGraphTransform';
import type { InfraNodeType } from '@/types/infraGraph';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NodeSize = 'small' | 'medium' | 'large';

interface BaseNodeProps {
  data: InfraNodeData;
  nodeType: InfraNodeType;
  children: React.ReactNode;
  className?: string;
}

const SIZE_CLASSES: Record<NodeSize, string> = {
  small:  'min-w-[140px] max-w-[170px] scale-[0.82]',
  medium: 'min-w-[190px] max-w-[240px]',
  large:  'min-w-[230px] max-w-[300px] scale-[1.15]',
};

const SIZE_PADDING: Record<NodeSize, string> = {
  small:  'px-2.5 py-2',
  medium: 'px-3.5 py-3',
  large:  'px-4 py-3.5',
};

export const BaseNode = React.memo(function BaseNode({
  data,
  nodeType,
  children,
  className,
}: BaseNodeProps) {
  const defaultColor = NODE_COLORS[nodeType];
  // customColor overrides the left-border and handle accent
  const color = (data.customColor as string | null | undefined) || defaultColor;
  const isDimmed = data.isDimmed;
  const isHighlighted = data.isHighlighted;
  const hasAlert = data.hasAlert;
  const nodeSize: NodeSize = (data.nodeSize as NodeSize | undefined) ?? 'medium';

  return (
    <div
      className={cn(
        'relative rounded-xl border transition-all duration-200 select-none cursor-pointer',
        'bg-[#13151a]/95 backdrop-blur-md border-white/10 shadow-lg hover:border-white/30 hover:shadow-2xl hover:scale-[1.02]',
        SIZE_CLASSES[nodeSize],
        isHighlighted && 'ring-2 ring-primary border-primary/60 shadow-[0_0_20px_rgba(255,107,0,0.25)]',
        hasAlert && !isHighlighted && 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.2)] ring-1 ring-rose-500/30',
        isDimmed && 'opacity-20 pointer-events-none grayscale',
        className
      )}
      style={{ borderLeftColor: color, borderLeftWidth: 3.5 }}
    >
      {/* Target handle (left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !border-2 !bg-[#13151a] hover:!scale-125 transition-transform"
        style={{ borderColor: color }}
      />

      {/* Content */}
      <div className={SIZE_PADDING[nodeSize]}>{children}</div>

      {/* Alert badge */}
      {hasAlert && (
        <div
          className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-600 border-2 border-[#13151a] flex items-center justify-center shadow-lg"
          title={data.alertTypes?.join(', ')}
          aria-label="Alerta de saúde"
        >
          <AlertTriangle className="w-2.5 h-2.5 text-white" />
        </div>
      )}

      {/* Source handle (right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !border-2 !bg-[#13151a] hover:!scale-125 transition-transform"
        style={{ borderColor: color }}
      />
    </div>
  );
});


/** Small label text for sublabels / IDs */
export function MonoLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-mono text-[10px] text-zinc-400 truncate block">
      {children}
    </span>
  );
}

/** Status dot + text badge */
export function StatusBadge({
  status,
  colorMap,
}: {
  status: string;
  colorMap?: Record<string, string>;
}) {
  const defaultColors: Record<string, string> = {
    active: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    expired: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    banned: 'text-red-500 bg-red-500/10 border-red-500/20',
    inactive: 'text-zinc-400 bg-zinc-800 border-zinc-700',
    paused: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    disabled: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    archived: 'text-zinc-400 bg-zinc-800 border-zinc-700',
  };
  const colorClass = (colorMap ?? defaultColors)[status] ?? 'text-zinc-400 bg-zinc-800 border-zinc-700';
  return (
    <span className={cn('flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border', colorClass)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

/** Country flag + code */
export function CountryTag({ country }: { country: string }) {
  return (
    <span className="text-[10px] text-zinc-400 font-mono font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800/80 border border-zinc-700/60">
      {country}
    </span>
  );
}
