/**
 * EdgeContextMenu — Context menu / Popover for customizing connection lines.
 * Allows: changing edge color, line pattern (solid, dashed, dotted), thickness, and resetting to system diagnostic style.
 */
import React, { useEffect, useRef } from 'react';
import { Palette, RotateCcw, Check, Sparkles, AlertTriangle, ArrowRight, Sliders } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NODE_ACCENT_COLORS } from './NodeContextMenu';

export interface CustomEdgeStyle {
  stroke?: string | null;
  strokeDasharray?: string | null;
  strokeWidth?: number | null;
}

interface EdgeContextMenuProps {
  edgeId: string;
  sourceLabel?: string;
  targetLabel?: string;
  relation?: string;
  isWarning?: boolean;
  warningReason?: string;
  x: number;
  y: number;
  currentStyle?: CustomEdgeStyle | null;
  onStyleChange: (edgeId: string, style: CustomEdgeStyle | null) => void;
  onClose: () => void;
}

const LINE_PATTERNS = [
  { label: 'Auto', value: 'auto', desc: 'Diagnóstico' },
  { label: 'Sólida', value: 'none', desc: 'Contínua' },
  { label: 'Tracejada', value: '6 4', desc: '6x4' },
  { label: 'Pontilhada', value: '2 4', desc: '2x4' },
];

const LINE_WIDTHS = [
  { label: '1.5px', value: 1.5 },
  { label: '2.5px', value: 2.5 },
  { label: '4px', value: 4 },
];

export const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({
  edgeId,
  sourceLabel,
  targetLabel,
  relation,
  isWarning,
  warningReason,
  x,
  y,
  currentStyle,
  onStyleChange,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Clamp coordinates
  const menuWidth = 270;
  const menuHeight = 360;
  const clampedX = Math.max(10, Math.min(x, window.innerWidth - menuWidth - 12));
  const clampedY = Math.max(10, Math.min(y, window.innerHeight - menuHeight - 12));

  const activeColor = currentStyle?.stroke || null;
  const activeDash = currentStyle?.strokeDasharray !== undefined ? currentStyle.strokeDasharray : 'auto';
  const activeWidth = currentStyle?.strokeWidth || null;

  const handleSetColor = (color: string | null) => {
    if (!color && !currentStyle?.strokeDasharray && !currentStyle?.strokeWidth) {
      onStyleChange(edgeId, null);
      return;
    }
    onStyleChange(edgeId, {
      ...currentStyle,
      stroke: color,
    });
  };

  const handleSetPattern = (val: string) => {
    const dashValue = val === 'auto' ? null : val === 'none' ? '' : val;
    onStyleChange(edgeId, {
      ...currentStyle,
      strokeDasharray: dashValue,
    });
  };

  const handleSetWidth = (w: number | null) => {
    onStyleChange(edgeId, {
      ...currentStyle,
      strokeWidth: w,
    });
  };

  const handleResetAll = () => {
    onStyleChange(edgeId, null);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      className={cn(
        'fixed z-[9999] w-[270px] rounded-xl border border-white/15',
        'bg-[#0c0e14]/98 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)]',
        'animate-in fade-in zoom-in-95 duration-150 select-none overflow-hidden text-zinc-100 p-3.5 space-y-3'
      )}
      style={{ left: clampedX, top: clampedY }}
      onContextMenu={(e) => e.preventDefault()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header with Connection Info */}
      <div className="pb-2 border-b border-white/10 space-y-1">
        <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400">
          <span className="flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5 text-primary" />
            Personalizar Conexão
          </span>
          {currentStyle && (
            <button
              type="button"
              onClick={handleResetAll}
              className="text-[10px] text-muted-foreground hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
              title="Restaurar estilo padrão da linha"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              Restaurar
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground pt-0.5 truncate">
          <span className="truncate max-w-[105px]" title={sourceLabel || 'Origem'}>
            {sourceLabel || 'Origem'}
          </span>
          <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="truncate max-w-[105px]" title={targetLabel || 'Destino'}>
            {targetLabel || 'Destino'}
          </span>
        </div>

        {relation && (
          <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wide">
            {relation.replace(/_/g, ' ')}
          </div>
        )}

        {isWarning && (
          <div className="flex items-center gap-1.5 text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-md mt-1">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            <span className="truncate">{warningReason || 'Alerta de Inconsistência Anti-ban'}</span>
          </div>
        )}
      </div>

      {/* Line Color Picker */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
            <Palette className="w-3 h-3 text-primary" />
            Cor da Linha
          </label>
          {activeColor && (
            <button
              type="button"
              onClick={() => handleSetColor(null)}
              className="text-[10px] text-zinc-400 hover:text-zinc-200"
            >
              Automática
            </button>
          )}
        </div>

        <div className="grid grid-cols-6 gap-1.5">
          {NODE_ACCENT_COLORS.map((c) => {
            const isSelected = activeColor === c.value;
            return (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => handleSetColor(c.value)}
                className={cn(
                  'w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer shadow-sm',
                  c.swatch,
                  isSelected
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-105'
                    : 'hover:scale-105 opacity-80 hover:opacity-100'
                )}
              >
                {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Line Pattern (Solid, Dashed, Dotted, Auto) */}
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          Padrão do Traço
        </label>
        <div className="grid grid-cols-4 gap-1">
          {LINE_PATTERNS.map((p) => {
            const isSelected =
              (p.value === 'auto' && (activeDash === 'auto' || activeDash === null)) ||
              (p.value === 'none' && activeDash === '') ||
              activeDash === p.value;

            return (
              <button
                key={p.value}
                type="button"
                onClick={() => handleSetPattern(p.value)}
                className={cn(
                  'px-1.5 py-1 rounded text-[10px] font-medium border text-center transition-all cursor-pointer',
                  isSelected
                    ? 'bg-primary/20 border-primary text-primary-foreground font-semibold'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                )}
                title={p.desc}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Line Width */}
      <div className="space-y-1.5 pt-0.5">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
          <span>Espessura</span>
          {activeWidth && (
            <button
              type="button"
              onClick={() => handleSetWidth(null)}
              className="text-[10px] text-zinc-400 hover:text-zinc-200 font-normal lowercase"
            >
              padrão
            </button>
          )}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {LINE_WIDTHS.map((w) => {
            const isSelected = activeWidth === w.value;
            return (
              <button
                key={w.value}
                type="button"
                onClick={() => handleSetWidth(w.value)}
                className={cn(
                  'py-1 rounded text-[10px] font-mono border text-center transition-all cursor-pointer',
                  isSelected
                    ? 'bg-primary/20 border-primary text-white font-bold'
                    : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                )}
              >
                {w.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
