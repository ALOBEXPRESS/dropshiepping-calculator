import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { handleCurrencyBlur } from "../../utils/currency";

interface PricingInputProps {
  costPrice: string;
  setCostPrice: (value: string) => void;
  handleFloatInput: (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  manualSellingPrice: string;
  setManualSellingPrice: (value: string) => void;
  markupMultiplier: string;
  setMarkupMultiplier: (value: string) => void;
  marketplace: string;
  competitorPrice: string;
  setCompetitorPrice: (value: string) => void;
  competitorMarkup: string;
  setCompetitorMarkup: (value: string) => void;
  weight: string;
  width: string;
  height: string;
  depth: string;
}

export const PricingInput: React.FC<PricingInputProps> = ({
  costPrice,
  setCostPrice,
  handleFloatInput,
  manualSellingPrice,
  setManualSellingPrice,
  markupMultiplier,
  setMarkupMultiplier,
  marketplace,
  competitorPrice,
  setCompetitorPrice,
  competitorMarkup,
  setCompetitorMarkup,
  weight,
  width,
  height,
  depth
}) => {
  // Helper to parse currency string to number
  const parseCurrency = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (!value) return 0;
    const cleaned = String(value).replace(/[^\d,.-]/g, '').replace(',', '.');
    return parseFloat(cleaned) || 0;
  };

  // Check if dimensions are missing
  const hasMissingDimensions = !weight || !width || !height || !depth;
  
  // Check if price is >= 79
  const costPriceValue = parseCurrency(costPrice);
  const showDimensionsWarning = marketplace === 'mercadolivre' && costPriceValue >= 79 && hasMissingDimensions;
  return (
    <>
      {/* Preço de Custo do Fornecedor */}
      <div className="relative w-full max-w-sm rounded-xl p-3.5 border border-border/70 bg-card/60 transition-all duration-300 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 mt-4 animate-fadeIn">
        <div className="flex items-center justify-between mb-2">
          <Label htmlFor="costPrice" className="text-sm font-bold text-foreground flex items-center gap-2 cursor-pointer">
            Preço de Custo do Fornecedor
          </Label>
        </div>
        <div className="relative flex items-center">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-extrabold text-lg select-none pointer-events-none">
            R$
          </span>
          <Input
            id="costPrice"
            type="text"
            inputMode="decimal"
            value={costPrice}
            onChange={handleFloatInput(setCostPrice)}
            onBlur={(e) => handleCurrencyBlur(e, setCostPrice)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="pl-12 pr-4 py-2.5 text-2xl font-black text-white bg-zinc-950/80 border border-border rounded-lg focus-visible:ring-0 focus-visible:ring-offset-0 shadow-inner placeholder:text-zinc-600 transition-all h-13"
            placeholder="0,00"
            step="0.01"
            autoFocus
          />
        </div>
        <p className="text-[11px] text-zinc-400 mt-2 flex items-center gap-1.5">
          <span className="text-xs">✨</span>
          <span>Insira o custo do produto para atualizar margens e lucros em tempo real</span>
        </p>
        {showDimensionsWarning && (
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              <strong>⚠️ Importante:</strong> Para produtos com preço ≥ R$ 79,00 no Mercado Livre, 
              as dimensões são obrigatórias para calcular o custo de frete grátis que você pagará.
            </p>
          </div>
        )}
      </div>

      {/* Preço de Venda Manual */}
      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
        <Label htmlFor="manualSellingPrice" className="text-base font-bold !text-blue-500">
          Preço de venda
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
            R$
          </span>
          <Input
            id="manualSellingPrice"
            type="text"
            inputMode="decimal"
            value={manualSellingPrice}
            onChange={handleFloatInput(setManualSellingPrice)}
            onBlur={(e) => handleCurrencyBlur(e, setManualSellingPrice)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className="pl-10 text-xl border border-blue-400 focus:border-blue-600 font-bold"
            placeholder="0,00"
            step="0.01"
          />
        </div>
      </div>

      {/* Markup */}
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label className="text-sm font-semibold text-gray-800 dark:text-white">
          Markup
        </Label>
        <Select value={markupMultiplier} onValueChange={setMarkupMultiplier}>
          <SelectTrigger id="markupMultiplier">
            <SelectValue placeholder="Selecione o markup" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="-3.0">-3.00x (Markup Negativo)</SelectItem>
            <SelectItem value="-2.0">-2.00x (Markup Negativo)</SelectItem>
            <SelectItem value="-1.5">-1.50x (Markup Negativo)</SelectItem>
            <SelectItem value="-1.25">-1.25x (Markup Negativo)</SelectItem>
            <SelectItem value="0">0 (Automático / Margem Recomendada)</SelectItem>
            <SelectItem value="1">1.0x</SelectItem>
            <SelectItem value="1.25">1.25x</SelectItem>
            <SelectItem value="1.5">1.5x</SelectItem>
            <SelectItem value="1.75">1.75x</SelectItem>
            <SelectItem value="2">2.0x</SelectItem>
            <SelectItem value="3">3.0x</SelectItem>
            <SelectItem value="4">4.0x</SelectItem>
            <SelectItem value="5">5.0x</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[10px] text-gray-500">Define o preço sugerido multiplicando o custo.</p>
      </div>
      
       {/* Preço Mínimo Concorrente */}
      <div className="grid w-full max-w-sm items-center gap-1.5 mt-4">
        <Label htmlFor="competitorPrice" className="text-sm font-semibold text-gray-800 dark:text-white">
          Preço Mínimo Concorrente ({
            marketplace === 'shopee' ? 'Shopee' : 
            marketplace === 'mercadolivre' ? 'Mercado Livre' : 
            marketplace === 'tiktok' ? 'Tiktok Shop' : 'Marketplaces'
          })
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
            R$
          </span>
          <Input
            id="competitorPrice"
            type="text"
            inputMode="decimal"
            value={competitorPrice}
            onChange={handleFloatInput(setCompetitorPrice)}
            className="pl-10 text-lg border-orange-200"
            placeholder="0,00"
            step="0.01"
          />
        </div>
      </div>

      {/* Competitor Markup */}
      {competitorPrice && (
          <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn mt-1">
            <Label className="text-sm font-semibold text-gray-800 dark:text-white">
              Markup sobre Concorrente
            </Label>
            <Select value={competitorMarkup} onValueChange={setCompetitorMarkup}>
              <SelectTrigger className="bg-orange-50 border-orange-200">
                <SelectValue placeholder="Selecione o markup" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 (Automático)</SelectItem>
                <SelectItem value="-1.5">-1.50x (Mais barato)</SelectItem>
                <SelectItem value="-1.25">-1.25x (Mais barato)</SelectItem>
                <SelectItem value="-1.10">-1.10x (Mais barato)</SelectItem>
                <SelectItem value="-1.05">-1.05x (Mais barato)</SelectItem>
                <SelectItem value="1">Igual (1.0x)</SelectItem>
                <SelectItem value="1.05">1.05x (Mais caro)</SelectItem>
                <SelectItem value="1.10">1.10x (Mais caro)</SelectItem>
                <SelectItem value="1.25">1.25x (Mais caro)</SelectItem>
                <SelectItem value="1.5">1.50x (Mais caro)</SelectItem>
              </SelectContent>
            </Select>
          </div>
      )}
    </>
  );
};
