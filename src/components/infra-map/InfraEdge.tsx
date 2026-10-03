import React from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { cn } from '@/lib/utils';

export const InfraEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
  label,
}) => {
  const [edgePath, defaultLabelX, defaultLabelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const relation = (data as Record<string, unknown> | undefined)?.relation as string | undefined;
  const isWarning = Boolean((data as Record<string, unknown> | undefined)?.isWarning);

  // Smart staggered label placement along the edge path to prevent collisions:
  // - runs_on (Device -> Account): staggered between 64% and 78%
  // - bc_* (Business Center -> Account): staggered between 22% and 34%
  // - default: midpoint (50%)
  let labelX = defaultLabelX;
  let labelY = defaultLabelY;

  const idHash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  if (relation === 'runs_on') {
    const factor = 0.64 + (idHash % 4) * 0.05; // 0.64, 0.69, 0.74, 0.79
    labelX = sourceX + (targetX - sourceX) * factor;
    labelY = sourceY + (targetY - sourceY) * factor;
  } else if (relation?.startsWith('bc_')) {
    const factor = 0.22 + (idHash % 3) * 0.06; // 0.22, 0.28, 0.34
    labelX = sourceX + (targetX - sourceX) * factor;
    labelY = sourceY + (targetY - sourceY) * factor;
  }

  // Label theme styling based on relation & health status
  const isOwner = relation === 'bc_owner_account';
  const isPartner = relation === 'bc_partner_access';
  const isAdAuth = relation === 'bc_ad_authorized';

  const isIdeal = label === '✓ 1:1 Ideal';

  if (isIdeal) {
    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          style={{ ...style, cursor: 'pointer' }}
          markerEnd={markerEnd}
          className="transition-all hover:stroke-[3.5px] cursor-pointer"
        />
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="opacity-0 hover:opacity-100 transition-opacity flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium select-none shadow-md z-10 border bg-[#06180e]/90 text-emerald-300 border-emerald-500/40 cursor-pointer"
            title="Conexão 1:1 Ideal (Clique para personalizar cor e estilo)"
          >
            ✓ 1:1 Ideal
          </div>
        </EdgeLabelRenderer>
      </>
    );
  }

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{ ...style, cursor: 'pointer' }}
        markerEnd={markerEnd}
        className="transition-all hover:stroke-[3.5px] cursor-pointer"
      />
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className={cn(
              'group flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-medium select-none shadow-md transition-all hover:scale-105 hover:z-50 z-10 border backdrop-blur-md cursor-pointer',
              isWarning && 'bg-[#180a0d]/95 text-rose-300 border-rose-500/50 shadow-rose-950/40',
              isOwner && 'bg-[#1a1406]/95 text-amber-300 border-amber-500/50 shadow-amber-950/40',
              isPartner && 'bg-[#06121f]/95 text-blue-300 border-blue-500/50 shadow-blue-950/40',
              isAdAuth && 'bg-[#06171a]/95 text-cyan-300 border-cyan-500/50 shadow-cyan-950/40',
              !isWarning && !isOwner && !isPartner && !isAdAuth && 'bg-[#090a0d]/95 text-zinc-300 border-white/10'
            )}
            title="Clique para personalizar cor e estilo da linha"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
