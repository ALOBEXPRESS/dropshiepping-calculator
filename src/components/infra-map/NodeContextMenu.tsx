/**
 * NodeContextMenu — Right-click context menu for map nodes.
 * Allows: hiding a node, changing its accent color.
 */
import React, { useEffect, useRef } from 'react';
import { EyeOff, Palette, RotateCcw, Check, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { InfraNodeType } from '@/types/infraGraph';

// Curated accent palette for node color overrides
export const NODE_ACCENT_COLORS = [
  { label: 'Laranja', value: '#FF4D00', swatch: 'bg-orange-500' },
  { label: 'Ciano', value: '#06B6D4', swatch: 'bg-cyan-400' },
  { label: 'Esmeralda', value: '#34D399', swatch: 'bg-emerald-400' },
  { label: 'Violeta', value: '#7C3AED', swatch: 'bg-violet-600' },
  { label: 'Âmbar', value: '#F59E0B', swatch: 'bg-amber-400' },
  { label: 'Rosa', value: '#F472B6', swatch: 'bg-pink-400' },
  { label: 'Azul', value: '#3B82F6', swatch: 'bg-blue-500' },
  { label: 'Lima', value: '#84CC16', swatch: 'bg-lime-500' },
  { label: 'Vermelho', value: '#EF4444', swatch: 'bg-red-500' },
  { label: 'Índigo', value: '#6366F1', swatch: 'bg-indigo-500' },
  { label: 'Teal', value: '#14B8A6', swatch: 'bg-teal-500' },
];

const NODE_TYPE_NAMES: Partial<Record<InfraNodeType, string>> = {
  proxy_provider: 'Provedores de Proxy',
  proxy: 'Proxies',
  platform_account: 'Contas',
  browser_profile: 'Perfis de Navegador',
  device: 'Dispositivos',
  business_center: 'Business Centers',
  ad_account: 'Contas de Anúncio',
  campaign: 'Campanhas',
  titular: 'Titulares',
};

interface NodeContextMenuProps {
  nodeId: string;
  nodeType?: InfraNodeType;
  nodeLabel: string;
  x: number;
  y: number;
  currentColor?: string | null;
  onHide: (nodeId: string) => void;
  onHideModule?: (moduleType: InfraNodeType) => void;
  onColorChange: (nodeId: string, color: string | null) => void;
  onClose: () => void;
}

export const NodeContextMenu: React.FC<NodeContextMenuProps> = ({
  nodeId,
  nodeType,
  nodeLabel,
  x,
  y,
  currentColor,
  onHide,
  onHideModule,
  onColorChange,
  onClose,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
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

  // Clamp position to viewport
  const menuWidth = 230;
  const menuHeight = 290;
  const clampedX = Math.min(x, window.innerWidth - menuWidth - 12);
  const clampedY = Math.min(y, window.innerHeight - menuHeight - 12);

  return (
    <div
      ref={menuRef}
      role="menu"
      className={cn(
        'fixed z-[9999] w-[230px] rounded-xl border border-white/15',
        'bg-[#0c0e14]/98 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.85)]',
        'animate-in fade-in zoom-in-95 duration-150 select-none overflow-hidden'
      )}
      style={{ left: clampedX, top: clampedY }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Header */}
      <div className="px-3.5 py-2.5 bg-white/[0.02] border-b border-white/[0.08]">
        <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest font-semibold">Ações do Nó</p>
        <p className="text-xs font-semibold text-zinc-100 truncate mt-0.5">{nodeLabel}</p>
      </div>

      {/* Actions */}
      <div className="p-1 space-y-0.5">
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            onHide(nodeId);
            onClose();
          }}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 rounded-lg',
            'hover:bg-amber-500/10 hover:text-amber-300 transition-colors cursor-pointer'
          )}
        >
          <EyeOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Ocultar este nó</span>
        </button>

        {nodeType && onHideModule && (
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              onHideModule(nodeType);
              onClose();
            }}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 text-xs text-rose-300 rounded-lg',
              'hover:bg-rose-500/10 hover:text-rose-200 transition-colors cursor-pointer'
            )}
          >
            <Layers className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">Ocultar módulo {NODE_TYPE_NAMES[nodeType] || ''}</span>
          </button>
        )}
      </div>

      {/* Color Picker */}
      <div className="px-3.5 py-2.5 border-t border-white/[0.08]">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Palette className="w-3 h-3 text-zinc-400" />
          <span className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">Cor de Destaque</span>
          {currentColor && (
            <button
              type="button"
              onClick={() => {
                onColorChange(nodeId, null);
                onClose();
              }}
              className="ml-auto flex items-center gap-1 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              title="Restaurar cor padrão do tipo"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              Padrão
            </button>
          )}
        </div>

        <div className="grid grid-cols-6 gap-1.5">
          {NODE_ACCENT_COLORS.map((color) => {
            const isActive = currentColor === color.value;
            return (
              <button
                key={color.value}
                type="button"
                title={color.label}
                onClick={() => {
                  onColorChange(nodeId, color.value);
                  onClose();
                }}
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-sm',
                  color.swatch,
                  isActive
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0c0e14] scale-110'
                    : 'hover:scale-110 hover:ring-1 hover:ring-white/50 opacity-85 hover:opacity-100'
                )}
                aria-label={`Cor ${color.label}`}
              >
                {isActive && <Check className="w-3 h-3 text-white drop-shadow stroke-[3]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
