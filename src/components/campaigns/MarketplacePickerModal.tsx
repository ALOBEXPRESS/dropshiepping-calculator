import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import tiktokImg from '@/imgs/tiktok-shop-seller-cent-icon-filled-256.png';
import mercadolivreImg from '@/imgs/mercadolivre.svg';
import amazonImg from '@/imgs/amazon.jpg';
import sheinImg from '@/imgs/shein.svg';
import type { CampaignMarketplace } from '@/types/campaigns';

interface MarketplaceOption {
  key: CampaignMarketplace;
  label: string;
  img: string;
  enabled: boolean;
}

const OPTIONS: MarketplaceOption[] = [
  { key: 'tiktok', label: 'TikTok Shop', img: tiktokImg, enabled: true },
  { key: 'mercadolivre', label: 'Mercado Livre', img: mercadolivreImg, enabled: false },
  { key: 'amazon', label: 'Amazon', img: amazonImg, enabled: false },
  { key: 'shein', label: 'Shein', img: sheinImg, enabled: false },
];

interface MarketplacePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (marketplace: CampaignMarketplace) => void;
}

export const MarketplacePickerModal: React.FC<MarketplacePickerModalProps> = ({
  open,
  onOpenChange,
  onSelect,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white text-lg">Selecione o Marketplace</DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm">
            Escolha a plataforma para criar sua campanha de tráfego pago.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 pt-2">
          {OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              disabled={!opt.enabled}
              onClick={() => { if (opt.enabled) { onSelect(opt.key); onOpenChange(false); } }}
              className={`relative flex flex-col items-center gap-3 p-5 rounded-xl border transition-all ${
                opt.enabled
                  ? 'border-zinc-700 bg-zinc-900/50 hover:border-orange-500 hover:bg-orange-500/5 cursor-pointer'
                  : 'border-zinc-800 bg-zinc-900/20 cursor-not-allowed opacity-50'
              }`}
            >
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-white flex items-center justify-center p-1">
                <img
                  src={opt.img}
                  alt={opt.label}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className={`text-sm font-medium ${opt.enabled ? 'text-zinc-200' : 'text-zinc-500'}`}>
                {opt.label}
              </span>
              {!opt.enabled && (
                <span className="absolute top-2 right-2 text-[9px] font-bold bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded-full">
                  Em breve
                </span>
              )}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
