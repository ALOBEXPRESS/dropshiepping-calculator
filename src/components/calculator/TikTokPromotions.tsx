import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TikTokPromotionsProps {
  marketplace: string;
  tiktokPromoProductValue: string;
  setTiktokPromoProductValue: (v: string) => void;
  tiktokPromoProductType: 'fixed' | 'percent';
  setTiktokPromoProductType: (v: 'fixed' | 'percent') => void;
  tiktokPromoProductUntil: string;
  setTiktokPromoProductUntil: (v: string) => void;
  tiktokPromoNewCustomerValue: string;
  setTiktokPromoNewCustomerValue: (v: string) => void;
  tiktokPromoNewCustomerType: 'fixed' | 'percent';
  setTiktokPromoNewCustomerType: (v: 'fixed' | 'percent') => void;
  tiktokPromoShippingValue: string;
  setTiktokPromoShippingValue: (v: string) => void;
  tiktokPromoShippingType: 'fixed' | 'percent';
  setTiktokPromoShippingType: (v: 'fixed' | 'percent') => void;
}

const TypeToggle: React.FC<{
  value: 'fixed' | 'percent';
  onChange: (v: 'fixed' | 'percent') => void;
  dark?: boolean;
}> = ({ value, onChange, dark }) => (
  <div className={`flex rounded-md overflow-hidden border ${dark ? 'border-zinc-700' : 'border-gray-300'} flex-shrink-0`}>
    <button type="button" onClick={() => onChange('fixed')}
      className={`px-2 py-1 text-xs font-bold transition-colors ${value === 'fixed'
        ? 'bg-pink-600 text-white'
        : dark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
      R$
    </button>
    <button type="button" onClick={() => onChange('percent')}
      className={`px-2 py-1 text-xs font-bold transition-colors ${value === 'percent'
        ? 'bg-pink-600 text-white'
        : dark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
      %
    </button>
  </div>
);

export const TikTokPromotions: React.FC<TikTokPromotionsProps> = ({
  marketplace,
  tiktokPromoProductValue, setTiktokPromoProductValue,
  tiktokPromoProductType, setTiktokPromoProductType,
  tiktokPromoProductUntil, setTiktokPromoProductUntil,
  tiktokPromoNewCustomerValue, setTiktokPromoNewCustomerValue,
  tiktokPromoNewCustomerType, setTiktokPromoNewCustomerType,
  tiktokPromoShippingValue, setTiktokPromoShippingValue,
  tiktokPromoShippingType, setTiktokPromoShippingType,
}) => {
  const [open, setOpen] = useState(false);

  if (marketplace !== 'tiktok') return null;

  const inputCls = 'bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-pink-500 h-8 text-sm dark:bg-zinc-900 dark:border-zinc-700 dark:text-white';

  const hasAnyPromo = tiktokPromoProductValue || tiktokPromoNewCustomerValue || tiktokPromoShippingValue;

  return (
    <div className="rounded-xl overflow-hidden border border-zinc-700/60 dark:border-zinc-700/60 mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-900/60 dark:bg-zinc-900/60 hover:bg-zinc-800/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-pink-400" />
          <span className="text-xs font-semibold text-pink-400 uppercase tracking-wide">Promoções TikTok</span>
          {hasAnyPromo && (
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
          )}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
      </button>

      {open && (
        <div className="px-4 py-4 space-y-5 bg-zinc-900/30 border-t border-zinc-700/50">

          {/* Desconto do Produto */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">Desconto do Produto</Label>
            <div className="flex items-center gap-2">
              <TypeToggle value={tiktokPromoProductType} onChange={setTiktokPromoProductType} dark />
              <Input
                type="text" inputMode="decimal" placeholder="0,00"
                value={tiktokPromoProductValue}
                onChange={(e) => setTiktokPromoProductValue(e.target.value.replace(/[^0-9,.]/g, ''))}
                className={`${inputCls} flex-1`}
              />
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-zinc-400 whitespace-nowrap w-16">Válido até</Label>
              <Input
                type="date"
                value={tiktokPromoProductUntil}
                onChange={(e) => setTiktokPromoProductUntil(e.target.value)}
                className={`${inputCls} flex-1`}
              />
              {tiktokPromoProductUntil && (
                <button type="button" onClick={() => setTiktokPromoProductUntil('')}
                  className="text-zinc-500 hover:text-zinc-300 text-xs">✕</button>
              )}
            </div>
          </div>

          {/* Cupom Novos Clientes */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">Cupom para Novos Clientes</Label>
            <div className="flex items-center gap-2">
              <TypeToggle value={tiktokPromoNewCustomerType} onChange={setTiktokPromoNewCustomerType} dark />
              <Input
                type="text" inputMode="decimal" placeholder="0,00"
                value={tiktokPromoNewCustomerValue}
                onChange={(e) => setTiktokPromoNewCustomerValue(e.target.value.replace(/[^0-9,.]/g, ''))}
                className={`${inputCls} flex-1`}
              />
            </div>
            <p className="text-[10px] text-zinc-500">Cupom aplicado apenas para novos clientes. Não reduz preço de venda base.</p>
          </div>

          {/* Desconto no Frete */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">Desconto no Frete</Label>
            <div className="flex items-center gap-2">
              <TypeToggle value={tiktokPromoShippingType} onChange={setTiktokPromoShippingType} dark />
              <Input
                type="text" inputMode="decimal" placeholder="0,00"
                value={tiktokPromoShippingValue}
                onChange={(e) => setTiktokPromoShippingValue(e.target.value.replace(/[^0-9,.]/g, ''))}
                className={`${inputCls} flex-1`}
              />
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
