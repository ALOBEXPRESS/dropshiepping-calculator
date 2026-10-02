import React from 'react';

export interface AffiliateDetailData {
  id: string;
  name: string;
  value: number;
  ref: string;
  date: string;
}

interface AffiliateDetailModalProps {
  open: boolean;
  data: AffiliateDetailData | null;
  onClose: () => void;
  onRequestDelete: (id: string) => void;
}

export const AffiliateDetailModal: React.FC<AffiliateDetailModalProps> = ({
  open,
  data,
  onClose,
  onRequestDelete,
}) => {
  if (!open || !data) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg,#022c22 0%,#064e3b 60%,#065f46 100%)',
          border: '1px solid rgba(16,185,129,0.45)',
          boxShadow: '0 24px 60px rgba(16,185,129,0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(16,185,129,0.2)' }}>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤝</span>
              <div>
                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">
                  Comissão de Afiliação
                </p>
                <p className="text-[10px] text-emerald-600">TikTok Shop Vitrine</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-full text-emerald-500 hover:bg-emerald-500/20 transition-colors text-lg leading-none"
              aria-label="Fechar"
            >
              ×
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-3">
          <div>
            <p className="text-[10px] text-emerald-600 uppercase tracking-wide mb-0.5">
              Produto / Referência
            </p>
            <p className="text-base font-bold text-emerald-100">{data.name}</p>
          </div>
          {data.ref && (
            <div>
              <p className="text-[10px] text-emerald-600 uppercase tracking-wide mb-0.5">
                Marketplace / Pedido
              </p>
              <p className="text-sm text-emerald-200">{data.ref}</p>
            </div>
          )}
          <div>
            <p className="text-[10px] text-emerald-600 uppercase tracking-wide mb-0.5">
              Data de Registro
            </p>
            <p className="text-sm text-emerald-200">
              {data.date
                ? new Intl.DateTimeFormat('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(data.date))
                : '—'}
            </p>
          </div>

          {/* Commission highlight */}
          <div
            className="rounded-xl p-4 flex items-center justify-between"
            style={{
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.3)',
            }}
          >
            <div>
              <p className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold">
                Comissão Recebida
              </p>
              <p className="text-[10px] text-emerald-600 mt-0.5">Receita adicional AlobExpress</p>
            </div>
            <p className="text-2xl font-black text-emerald-400">
              +{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(data.value)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: 'rgba(16,185,129,0.12)',
              color: '#6ee7b7',
              border: '1px solid rgba(16,185,129,0.3)',
            }}
          >
            Fechar
          </button>
          <button
            onClick={() => onRequestDelete(data.id)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            style={{
              background: 'rgba(239,68,68,0.15)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.35)',
            }}
          >
            Excluir Entrada
          </button>
        </div>
      </div>
    </div>
  );
};
