import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { handleCurrencyChange } from '../../utils/currency';
import { ChevronDown, ChevronRight, Info } from "lucide-react";

interface TikTokConfigProps {
  marketplace: string;
  tiktokCommission: string;
  setTiktokCommission: (value: string) => void;
  marketplaceShippingCost: string;
  setMarketplaceShippingCost: (value: string) => void;
  tiktokAdsEnabled: boolean;
  setTiktokAdsEnabled: (value: boolean) => void;
  tiktokAdFormat: string;
  setTiktokAdFormat: (value: string) => void;
  tiktokAudience: string;
  setTiktokAudience: (value: string) => void;
  tiktokCampaignObjective: string;
  setTiktokCampaignObjective: (value: string) => void;
  tiktokDailyBudget: string;
  setTiktokDailyBudget: (value: string) => void;
  tiktokCPA: string;
  setTiktokCPA: (value: string) => void;
  tiktokAdsSalesQuantity: string;
  setTiktokAdsSalesQuantity: (value: string) => void;
  tiktokCPM: string;
  setTiktokCPM: (value: string) => void;
  tiktokCTR: string;
  setTiktokCTR: (value: string) => void;
  tiktokCVR: string;
  setTiktokCVR: (value: string) => void;
  tiktokCatalogId: string;
  setTiktokCatalogId: (value: string) => void;
  tiktokSfpEnabled?: boolean;
  setTiktokSfpEnabled?: (value: boolean) => void;
}

export const TikTokConfig: React.FC<TikTokConfigProps> = ({
  marketplace,
  tiktokCommission,
  setTiktokCommission,
  marketplaceShippingCost,
  setMarketplaceShippingCost,
  tiktokAdsEnabled,
  setTiktokAdsEnabled,
  tiktokAdFormat,
  setTiktokAdFormat,
  tiktokAudience,
  setTiktokAudience,
  tiktokCampaignObjective,
  setTiktokCampaignObjective,
  tiktokDailyBudget,
  setTiktokDailyBudget,
  tiktokCPA,
  setTiktokCPA,
  tiktokAdsSalesQuantity,
  setTiktokAdsSalesQuantity,
  tiktokCPM,
  setTiktokCPM,
  tiktokCTR,
  setTiktokCTR,
  tiktokCVR,
  setTiktokCVR,
  tiktokCatalogId,
  setTiktokCatalogId,
  tiktokSfpEnabled = false,
  setTiktokSfpEnabled
}) => {
  const [isOpenMetrics, setIsOpenMetrics] = React.useState(false);

  if (marketplace !== 'tiktok') return null;

  const showCatalogInput = tiktokAdFormat === 'shopping_ads' || tiktokCampaignObjective === 'video_shopping';

  return (
    <>
      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
        <Label htmlFor="tiktokCommission" className="text-sm font-semibold text-gray-800 dark:text-white">
          Taxa de Comissão Tiktok (%)
        </Label>
        <div className="relative">
          <Input
            id="tiktokCommission"
            type="text"
            inputMode="decimal"
            value={tiktokCommission}
            onChange={(e) => handleCurrencyChange(e, setTiktokCommission)}
            placeholder="Ex: 10"
          />
        </div>
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
        <Label htmlFor="tiktokShipping" className="text-sm font-semibold text-gray-800 dark:text-white">
          Valor do Frete (R$)
        </Label>
        <div className="relative">
          <Input
            id="tiktokShipping"
            type="text"
            inputMode="decimal"
            value={marketplaceShippingCost}
            onChange={(e) => handleCurrencyChange(e, setMarketplaceShippingCost)}
            placeholder="0,00"
            disabled={tiktokSfpEnabled}
            className={tiktokSfpEnabled ? 'opacity-50 cursor-not-allowed' : ''}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg border border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/30">
        <Checkbox
          id="tiktokSfp"
          checked={tiktokSfpEnabled}
          onCheckedChange={(checked) => {
            if (setTiktokSfpEnabled) {
              setTiktokSfpEnabled(checked as boolean);
              if (checked) {
                setMarketplaceShippingCost('0');
              }
            }
          }}
          className="border-blue-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 dark:border-blue-600 dark:data-[state=checked]:bg-blue-500 dark:data-[state=checked]:border-blue-500"
        />
        <div className="flex flex-col">
          <Label htmlFor="tiktokSfp" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300 cursor-pointer">
            Programa de Frete Grátis (SFP)
          </Label>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Taxa de serviço adicional de 6% sobre o preço de venda
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800">
        <Checkbox
          id="tiktokAds"
          checked={tiktokAdsEnabled}
          onCheckedChange={(checked) => setTiktokAdsEnabled(checked as boolean)}
          className="border-gray-300 data-[state=checked]:bg-black data-[state=checked]:border-black dark:border-zinc-600 dark:data-[state=checked]:bg-white dark:data-[state=checked]:border-white dark:data-[state=checked]:text-black"
        />
        <Label htmlFor="tiktokAds" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-300 cursor-pointer">
          Calcular Tiktokshop Ads
        </Label>
      </div>

      {tiktokAdsEnabled && (
        <div className="space-y-4 border-l-2 border-black/10 pl-4 ml-1 animate-fadeIn dark:border-white/10">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label className="text-xs font-semibold text-gray-700 mb-1 dark:text-gray-300">
              Formato do Anúncio
            </Label>
            <Select value={tiktokAdFormat} onValueChange={setTiktokAdFormat}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o formato" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="in_feed">In-Feed Ads</SelectItem>
                <SelectItem value="top_view">TopView</SelectItem>
                <SelectItem value="spark_ads">Spark Ads</SelectItem>
                <SelectItem value="hashtag_challenge">Hashtag Challenge</SelectItem>
                <SelectItem value="shopping_ads">Video Shopping Ads</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label className="text-xs font-semibold text-gray-700 mb-1 dark:text-gray-300">
              Objetivo da Campanha
            </Label>
            <Select value={tiktokCampaignObjective} onValueChange={setTiktokCampaignObjective}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o objetivo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conversions">Conversões (Vendas)</SelectItem>
                <SelectItem value="video_shopping">Video Shopping</SelectItem>
                <SelectItem value="traffic">Tráfego</SelectItem>
                <SelectItem value="reach">Alcance</SelectItem>
                <SelectItem value="app_install">Instalação de App</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showCatalogInput && (
             <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
               <div className="flex items-center gap-2">
                 <Label htmlFor="tiktokCatalogId" className="text-xs font-semibold text-gray-700 mb-1 dark:text-gray-300">
                   ID do Catálogo (Opcional)
                 </Label>
                 <span title="Necessário para Shopping Ads. Encontre no TikTok Business Center.">
                   <Info className="h-3 w-3 text-gray-400" />
                 </span>
               </div>
               <Input
                 id="tiktokCatalogId"
                 value={tiktokCatalogId}
                 onChange={(e) => setTiktokCatalogId(e.target.value)}
                 placeholder="Ex: 71234567890..."
               />
             </div>
          )}

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="tiktokAudience" className="text-xs font-semibold text-gray-700 mb-1 dark:text-gray-300">
              Segmentação e Público-alvo
            </Label>
            <Input
              id="tiktokAudience"
              value={tiktokAudience}
              onChange={(e) => setTiktokAudience(e.target.value)}
              placeholder="Localização, interesses, idade..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="tiktokCPA" className="text-xs font-semibold text-gray-700 mb-1 dark:text-gray-300">
                CPA (Custo por Ação)
              </Label>
              <Input
                id="tiktokCPA"
                type="text"
                inputMode="decimal"
                value={tiktokCPA}
                onChange={(e) => handleCurrencyChange(e, setTiktokCPA)}
                placeholder="0,00"
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="tiktokSales" className="text-xs font-semibold text-gray-700 mb-1 dark:text-gray-300">
                Vendas Esperadas
              </Label>
              <Input
                id="tiktokSales"
                type="text"
                inputMode="numeric"
                value={tiktokAdsSalesQuantity}
                onChange={(e) => setTiktokAdsSalesQuantity(e.target.value.replace(/\D/g, ''))}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="tiktokDailyBudget" className="text-xs font-semibold text-gray-700 mb-1 dark:text-gray-300">
              Orçamento Diário (Opcional)
            </Label>
            <Input
              id="tiktokDailyBudget"
              type="text"
              inputMode="decimal"
              value={tiktokDailyBudget}
              onChange={(e) => handleCurrencyChange(e, setTiktokDailyBudget)}
              placeholder="0,00"
            />
            <p className="text-[10px] text-gray-500">
              Se preenchido, será usado como teto se o cálculo por CPA/Métricas exceder.
            </p>
          </div>

          <div className="w-full space-y-2 border border-gray-100 rounded-md p-2 bg-gray-50/50 dark:bg-zinc-900/50 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setIsOpenMetrics((prev) => !prev)}
              className="flex items-center justify-between w-full text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <span>Métricas Avançadas (Opcional)</span>
              {isOpenMetrics ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            </button>
            {isOpenMetrics && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="tiktokCPM" className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">
                      CPM (R$)
                    </Label>
                    <Input
                      id="tiktokCPM"
                      type="text"
                      inputMode="decimal"
                      value={tiktokCPM}
                      onChange={(e) => handleCurrencyChange(e, setTiktokCPM)}
                      placeholder="0,00"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="tiktokCTR" className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">
                      CTR (%)
                    </Label>
                    <Input
                      id="tiktokCTR"
                      type="text"
                      inputMode="decimal"
                      value={tiktokCTR}
                      onChange={(e) => handleCurrencyChange(e, setTiktokCTR)}
                      placeholder="1,00"
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="grid w-full items-center gap-1.5">
                    <Label htmlFor="tiktokCVR" className="text-[10px] font-semibold text-gray-600 dark:text-gray-400">
                      CVR (%)
                    </Label>
                    <Input
                      id="tiktokCVR"
                      type="text"
                      inputMode="decimal"
                      value={tiktokCVR}
                      onChange={(e) => handleCurrencyChange(e, setTiktokCVR)}
                      placeholder="1,50"
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 italic">
                  Usado para calcular o orçamento estimado se o CPA não for informado.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
