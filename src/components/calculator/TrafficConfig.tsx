import React, { useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { TrendingUp, AlertCircle, DollarSign, Instagram, Music, Twitter } from 'lucide-react';
import { AI_MODELS, KIE_PLANS } from '../../services/pricingService';
import { GatewayConfig } from './GatewayConfig';
import { handleCurrencyChange } from '../../utils/currency';
import type { Influencer, Affiliate } from '../../types/calculator';
import { useOrganicChannels } from '../../hooks/useOrganicChannels';
import { useInfluencers } from '../../hooks/useInfluencers';
import { useAffiliates } from '../../hooks/useAffiliates';
import { useSettings } from '../../contexts/SettingsContext';

interface TrafficConfigProps {
  trafficMode: 'paid' | 'organic';
  handleTrafficModeChange: (value: 'paid' | 'organic') => void;
  paidTraffic: string;
  setPaidTraffic: (value: string) => void;
  paidTrafficType: 'percent' | 'fixed';
  setPaidTrafficType: (value: 'percent' | 'fixed') => void;
  organicSubMode: 'manual' | 'automated';
  setOrganicSubMode: (value: 'manual' | 'automated') => void;
  organicApi: 'gemini' | 'chatgpt';
  setOrganicApi: (value: 'gemini' | 'chatgpt') => void;
  orgImpressions: string;
  setOrgImpressions: (value: string) => void;
  orgClicks: string;
  setOrgClicks: (value: string) => void;
  orgSales: string;
  setOrgSales: (value: string) => void;
  orgFreq: string;
  setOrgFreq: (value: string) => void;
  organicChannels: string[];
  setOrganicChannels: (value: string[]) => void;
  organicChannelLinks: Record<string, string>;
  setOrganicChannelLinks: (value: Record<string, string>) => void;
  organicChannelNames: Record<string, string>;
  setOrganicChannelNames: (value: Record<string, string>) => void;
  orgCostVideo: string;
  setOrgCostVideo: (value: string) => void;
  useUploadPostFree: boolean;
  setUseUploadPostFree: (value: boolean) => void;
  selectedKiePlan: string;
  setSelectedKiePlan: (value: string) => void;
  currentCredits: string;
  setCurrentCredits: (value: string) => void;
  selectedAiModel: string;
  setSelectedAiModel: (value: string) => void;
  videoDuration: string;
  setVideoDuration: (value: string) => void;
  
  // Paid Traffic Gateway Props
  paidTrafficGatewayBank: string;
  handlePaidTrafficGatewayBankChange: (value: string) => void;
  paidTrafficGatewayMethod: string;
  handlePaidTrafficGatewayMethodChange: (value: string) => void;
  paidTrafficGatewayInstallments: string;
  handlePaidTrafficGatewayInstallmentsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  paidTrafficGatewayFee: string;
  setPaidTrafficGatewayFee: (value: string) => void;
  paidTrafficGatewayFeeType: 'percent' | 'fixed';
  setPaidTrafficGatewayFeeType: (value: 'percent' | 'fixed') => void;
  paidTrafficGatewayFixedFee: string;
  // Video Generation LLM Props
  selectedInfluencerId?: string | null;
  setSelectedInfluencerId?: (value: string | null) => void;
  videoGenerationLlm?: 'veo3' | 'sora2' | 'grok' | 'wan2' | 'copia' | 'kling' | 'runway' | 'luma' | 'pika25' | 'seedance' | null;
  setVideoGenerationLlm?: (value: 'veo3' | 'sora2' | 'grok' | 'wan2' | 'copia' | 'kling' | 'runway' | 'luma' | 'pika25' | 'seedance' | null) => void;
  videoGenerationPlan?: 'free' | 'paid' | null;
  setVideoGenerationPlan?: (value: 'free' | 'paid' | null) => void;
  
  // Paid Metrics Props
  paidConversionRate?: string;
  setPaidConversionRate?: (value: string) => void;
  paidCtr?: string;
  setPaidCtr?: (value: string) => void;
  adsCPC?: string;
  setAdsCPC?: (value: string) => void;

  // Influencer Marketing Props
  influencers: Influencer[];
  setInfluencers: (influencers: Influencer[]) => void;

  // Affiliate Marketing Props
  affiliates: Affiliate[];
  setAffiliates: (affiliates: Affiliate[]) => void;
}

export const TrafficConfig: React.FC<TrafficConfigProps> = ({
  trafficMode,
  handleTrafficModeChange,
  paidTraffic,
  setPaidTraffic,
  paidTrafficType,
  setPaidTrafficType,
  organicSubMode,
  setOrganicSubMode,
  organicApi,
  setOrganicApi,
  orgImpressions,
  setOrgImpressions,
  orgClicks,
  setOrgClicks,
  orgSales,
  setOrgSales,
  orgFreq,
  setOrgFreq,
  organicChannels,
  setOrganicChannels,
  organicChannelLinks,
  setOrganicChannelLinks,
  organicChannelNames,
  setOrganicChannelNames,
  orgCostVideo,
  setOrgCostVideo,
  useUploadPostFree,
  setUseUploadPostFree,
  selectedKiePlan,
  setSelectedKiePlan,
  currentCredits,
  setCurrentCredits,
  selectedAiModel,
  setSelectedAiModel,
  videoDuration,
  setVideoDuration,
  paidTrafficGatewayBank,
  handlePaidTrafficGatewayBankChange,
  paidTrafficGatewayMethod,
  handlePaidTrafficGatewayMethodChange,
  paidTrafficGatewayInstallments,
  handlePaidTrafficGatewayInstallmentsChange,
  paidTrafficGatewayFee,
  setPaidTrafficGatewayFee,
  paidTrafficGatewayFeeType,
  setPaidTrafficGatewayFeeType,
  paidTrafficGatewayFixedFee,
  selectedInfluencerId,
  setSelectedInfluencerId,
  videoGenerationLlm,
  setVideoGenerationLlm,
  videoGenerationPlan,
  setVideoGenerationPlan,
  paidConversionRate,
  setPaidConversionRate,
  paidCtr,
  setPaidCtr,
  adsCPC,
  setAdsCPC,
  influencers,
  setInfluencers,
  affiliates,
  setAffiliates
}) => {
  // Helper calculations for Paid Traffic display
  // Use a default value of '0' if the prop is undefined to avoid errors
  const safePaidTraffic = paidTraffic || '0';
  const safeAdsCPC = adsCPC || '0';
  const safePaidCtr = paidCtr || '0';
  const safePaidConversionRate = paidConversionRate || '0';

  const paidInvestment = parseFloat(safePaidTraffic.replace(/\./g, '').replace(',', '.')) || 0;
  const cpc = parseFloat(safeAdsCPC.replace(/\./g, '').replace(',', '.')) || 0;
  const ctr = parseFloat(safePaidCtr.replace(/\./g, '').replace(',', '.')) || 0;
  const convRate = parseFloat(safePaidConversionRate.replace(/\./g, '').replace(',', '.')) || 0;
  
  // Format helpers
  const formatNumber = (num: number) => Math.floor(num).toLocaleString('pt-BR');
  
  // Buscar canais do banco de dados
  const { channels: organicChannelOptions } = useOrganicChannels();
  
  // Buscar organizationId e influencers/affiliates do banco
  const { organizationId } = useSettings();
  const { influencers: influencersDB, loading: loadingInfluencers } = useInfluencers(organizationId ?? undefined);
  const { affiliates: affiliatesDB, loading: loadingAffiliates } = useAffiliates(organizationId ?? undefined);

  // Sync affiliates from DB when they load — always update percentage from marketplace commission
  // This ensures commission changes in Settings are reflected without page reload
  useEffect(() => {
    if (loadingAffiliates || affiliatesDB.length === 0) return;

    if (affiliates.length === 0) {
      // First load: do NOT auto-select — leave empty so user picks manually
      return;
    } else {
      // Already have affiliates: just refresh the percentage/marketplaceName from DB
      // (in case commission was updated in Settings)
      const updated: typeof affiliates = affiliates.map(aff => {
        const dbEntry = affiliatesDB.find(a => a.name === aff.name);
        if (!dbEntry) return aff;
        return {
          ...aff,
          percentage: (dbEntry.marketplace_commission_rate ?? dbEntry.percentage).toString(),
          marketplaceName: dbEntry.marketplace_name ?? aff.marketplaceName
        };
      });
      setAffiliates(updated);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingAffiliates, affiliatesDB]);

  // Group affiliates by marketplace
  const affiliatesByMarketplace = affiliatesDB.reduce<Record<string, typeof affiliatesDB>>((acc, aff) => {
    const key = aff.marketplace_name || 'Sem marketplace';
    if (!acc[key]) acc[key] = [];
    acc[key].push(aff);
    return acc;
  }, {});

  // Track open state per marketplace accordion
  const [openMarketplaces, setOpenMarketplaces] = React.useState<Record<string, boolean>>({});
  const toggleMarketplaceOpen = (name: string) => setOpenMarketplaces(prev => ({ ...prev, [name]: !prev[name] }));
  // Default open = true when not yet set
  const isMarketplaceOpen = (name: string) => openMarketplaces[name] === true;
  
  const selectedOrganicChannels = organicChannelOptions.filter((option) => organicChannels.includes(option.key));
  // Sempre mostrar todos os canais disponíveis
  const channelButtons = organicChannelOptions;
  const handleOrganicChannelToggle = (key: string, checked: boolean) => {
    if (checked) {
      if (!organicChannels.includes(key)) {
        setOrganicChannels([...organicChannels, key]);
      }
      return;
    }
    const nextChannels = organicChannels.filter((item) => item !== key);
    const nextLinks = { ...organicChannelLinks };
    const nextNames = { ...organicChannelNames };
    delete nextLinks[key];
    delete nextNames[key];
    setOrganicChannels(nextChannels);
    setOrganicChannelLinks(nextLinks);
    setOrganicChannelNames(nextNames);
  };
  const handleOrganicChannelLinkChange = (key: string, value: string) => {
    setOrganicChannelLinks({ ...organicChannelLinks, [key]: value });
  };
  const handleOrganicChannelNameChange = (key: string, value: string) => {
    setOrganicChannelNames({ ...organicChannelNames, [key]: value });
  };



  return (
    <>
       {/* Seletor de Tráfego: Pago vs Orgânico */}
        <div className="flex items-center space-x-2 bg-purple-50 p-3 rounded-lg border border-purple-100 mb-4 animate-fadeIn dark:bg-[#FF3366]">
          <div className="grid grid-cols-2 gap-2 w-full">
              <Button
                  variant={trafficMode === 'paid' ? 'default' : 'outline'}
                  onClick={() => handleTrafficModeChange('paid')}
                  className={trafficMode === 'paid' ? 'bg-green-600 hover:bg-green-700 text-white dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}
              >
                  Tráfego Pago
              </Button>
              <Button
                  variant={trafficMode === 'organic' ? 'default' : 'outline'}
                  onClick={() => handleTrafficModeChange('organic')}
                  className={trafficMode === 'organic' ? 'bg-[#fe2c55] hover:bg-[#d91c42] text-white dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}
              >
                  Tráfego Orgânico
              </Button>
          </div>
        </div>

       {/* Tráfego Pago (Original) */}
      {trafficMode === 'paid' && (
      <CollapsibleSection
        title="Investimento em Tráfego"
        defaultOpen={false}
        icon={<DollarSign className="w-4 h-4 text-green-600" />}
        className="mt-0"
      >
      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
        <Label htmlFor="paidTraffic" className="sr-only">
          Investimento em Tráfego
        </Label>
        <div className="flex items-center justify-end">
            <div className="flex items-center space-x-2">
                <Button
                    size="sm"
                    variant={paidTrafficType === 'percent' ? 'default' : 'outline'}
                    onClick={() => setPaidTrafficType('percent')}
                    className={`h-6 text-xs ${paidTrafficType === 'percent' ? 'bg-blue-600 dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}`}
                >
                    %
                </Button>
                <Button
                    size="sm"
                    variant={paidTrafficType === 'fixed' ? 'default' : 'outline'}
                    onClick={() => setPaidTrafficType('fixed')}
                    className={`h-6 text-xs ${paidTrafficType === 'fixed' ? 'bg-blue-600 dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}`}
                >
                    R$
                </Button>
            </div>
        </div>
        <div className="relative">
            {paidTrafficType === 'fixed' && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                    R$
                </span>
            )}
          <Input
            id="paidTraffic"
            type="text"
            inputMode="decimal"
            value={paidTraffic}
            onChange={(e) => handleCurrencyChange(e, setPaidTraffic)}
            placeholder="0,00"
            className={paidTrafficType === 'fixed' ? 'pl-8' : ''}
          />
          {paidTrafficType === 'percent' && (
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                    %
                </span>
            )}
        </div>

        {/* Métricas de Tráfego Pago */}
        <div className="grid grid-cols-2 gap-4 mt-4">
             <div className="space-y-1">
                <Label className="text-xs text-gray-600 dark:text-gray-200">CPC Médio (R$)</Label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-200 font-semibold text-xs">R$</span>
                    <Input
                        type="text"
                        inputMode="decimal"
                        value={safeAdsCPC}
                        onChange={(e) => setAdsCPC && handleCurrencyChange(e, setAdsCPC)}
                        placeholder="0,00"
                        className="h-8 bg-white dark:bg-gray-800 dark:text-white pl-8"
                    />
                </div>
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-gray-600 dark:text-gray-200">CTR Estimado (%)</Label>
                 <div className="relative">
                    <Input
                        type="text"
                        inputMode="decimal"
                        value={safePaidCtr}
                        onChange={(e) => setPaidCtr && handleCurrencyChange(e, setPaidCtr)}
                        placeholder="0,00"
                        className="h-8 bg-white dark:bg-gray-800 dark:text-white"
                    />
                     <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-200 font-semibold text-xs">%</span>
                </div>
            </div>
            <div className="space-y-1">
                <Label className="text-xs text-gray-600 dark:text-gray-200">Taxa Conv. (%)</Label>
                 <div className="relative">
                    <Input
                        type="text"
                        inputMode="decimal"
                        value={safePaidConversionRate}
                        onChange={(e) => setPaidConversionRate && handleCurrencyChange(e, setPaidConversionRate)}
                        placeholder="0,00"
                        className="h-8 bg-white dark:bg-gray-800 dark:text-white"
                    />
                     <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-200 font-semibold text-xs">%</span>
                </div>
            </div>
             <div className="space-y-1">
                <Label className="text-xs text-gray-600">Cliques Est.</Label>
                <Input
                    type="text"
                    value={paidTrafficType === 'fixed' && cpc > 0 ? formatNumber(paidInvestment / cpc) : '-'}
                    readOnly
                    className="h-8 bg-gray-100 text-gray-500"
                />
            </div>
             <div className="space-y-1">
                <Label className="text-xs text-gray-600">Impressões Est.</Label>
                <Input
                    type="text"
                    value={paidTrafficType === 'fixed' && ctr > 0 && cpc > 0 ? formatNumber((paidInvestment / cpc) / (ctr / 100)) : '-'}
                    readOnly
                    className="h-8 bg-gray-100 text-gray-500"
                />
            </div>
             <div className="space-y-1">
                <Label className="text-xs text-gray-600">Vendas Est.</Label>
                <Input
                    type="text"
                    value={paidTrafficType === 'fixed' && cpc > 0 ? formatNumber((paidInvestment / cpc) * (convRate / 100)) : '-'}
                    readOnly
                    className="h-8 bg-gray-100 text-gray-500"
                />
            </div>
        </div>
        
        <div className="mt-4 border-t pt-4">
            <Label className="text-sm font-semibold text-gray-800 mb-2 block">
              Forma de Pagamento do Tráfego
            </Label>
            <GatewayConfig
              gatewayBank={paidTrafficGatewayBank}
              handleGatewayBankChange={handlePaidTrafficGatewayBankChange}
              gatewayMethod={paidTrafficGatewayMethod}
              handleGatewayMethodChange={handlePaidTrafficGatewayMethodChange}
              gatewayInstallments={paidTrafficGatewayInstallments}
              handleGatewayInstallmentsChange={handlePaidTrafficGatewayInstallmentsChange}
              gatewayFee={paidTrafficGatewayFee}
              setGatewayFee={setPaidTrafficGatewayFee}
              gatewayFeeType={paidTrafficGatewayFeeType}
              setGatewayFeeType={setPaidTrafficGatewayFeeType}
              gatewayFixedFee={paidTrafficGatewayFixedFee}
              idPrefix="paidTrafficGateway"
            />
        </div>
      </div>
      </CollapsibleSection>
      )}

       {trafficMode === 'organic' && (
           <CollapsibleSection
               title="Configuração de Tráfego Orgânico"
               icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
               className="bg-green-50 border border-green-100 dark:bg-[#FF3366]"
           >
               <div className="space-y-4">
                   <div className="flex gap-2 mb-2 flex-wrap">
                       <Button
                           size="sm"
                           variant={organicSubMode === 'manual' ? 'default' : 'outline'}
                           onClick={() => setOrganicSubMode('manual')}
                           className={`flex-1 text-xs ${organicSubMode === 'manual' ? 'bg-green-600 dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}`}
                       >
                           Forma Manual (MindVideo + n8n)
                       </Button>
                       <Button
                           size="sm"
                           variant={organicSubMode === 'automated' ? 'default' : 'outline'}
                           onClick={() => setOrganicSubMode('automated')}
                           className={`flex-1 text-xs whitespace-normal h-auto min-h-[32px] py-1 ${organicSubMode === 'automated' ? 'bg-blue-600 dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}`}
                       >
                           Forma Automatizada (Kie.ai + n8n)
                       </Button>
                   </div>

                   <div className="border-b border-gray-100 pb-4 mb-4">
                       <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Marketing de Influencer</h4>
                       
                       {loadingInfluencers ? (
                           <div className="text-center py-4">
                               <p className="text-xs text-gray-500 dark:text-gray-200">Carregando influencers...</p>
                           </div>
                       ) : influencersDB.length === 0 ? (
                           <div className="text-center py-4 bg-gray-50 rounded-lg dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
                               <p className="text-xs text-gray-500 dark:text-gray-200">
                                   Nenhum influencer cadastrado. Cadastre influencers primeiro para poder selecioná-los.
                               </p>
                           </div>
                       ) : (
                           <div className="space-y-2">
                               {influencersDB.map((influencerDB) => {
                                   const isSelected = influencers.some(inf => inf.name === influencerDB.name);
                                   const selectedInfluencer = influencers.find(inf => inf.name === influencerDB.name);
                                   
                                   return (
                                       <div key={influencerDB.id} className="p-3 bg-gray-50 rounded-lg dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
                                           <div className="flex items-start gap-3">
                                               <Checkbox
                                                   id={`influencer-${influencerDB.id}`}
                                                   checked={isSelected}
                                                   onCheckedChange={(checked) => {
                                                       if (checked) {
                                                           setInfluencers([...influencers, {
                                                               id: crypto.randomUUID(),
                                                               name: influencerDB.name,
                                                               instagram: influencerDB.instagram || '',
                                                               tiktok: influencerDB.tiktok || '',
                                                               twitter: influencerDB.twitter || '',
                                                               percentage: influencerDB.percentage.toString()
                                                           }]);
                                                       } else {
                                                           setInfluencers(influencers.filter(inf => inf.name !== influencerDB.name));
                                                       }
                                                   }}
                                                   className="mt-1"
                                               />
                                               <div className="flex-1">
                                                   <Label 
                                                       htmlFor={`influencer-${influencerDB.id}`}
                                                       className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
                                                   >
                                                       {influencerDB.name}
                                                   </Label>
                                                   <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-200">
                                                       {influencerDB.instagram && (
                                                           <span className="flex items-center gap-1">
                                                               <Instagram className="w-3 h-3" /> {influencerDB.instagram}
                                                           </span>
                                                       )}
                                                       {influencerDB.tiktok && (
                                                           <span className="flex items-center gap-1">
                                                               <Music className="w-3 h-3" /> {influencerDB.tiktok}
                                                           </span>
                                                       )}
                                                       {influencerDB.twitter && (
                                                           <span className="flex items-center gap-1">
                                                               <Twitter className="w-3 h-3" /> {influencerDB.twitter}
                                                           </span>
                                                       )}
                                                   </div>
                                                   {isSelected && (
                                                       <div className="mt-2">
                                                           <Label className="text-xs text-gray-600 dark:text-gray-200">Porcentagem</Label>
                                                           <div className="relative mt-1">
                                                               <Input
                                                                   value={selectedInfluencer?.percentage || ''}
                                                                   onChange={(e) => {
                                                                       const newInfluencers = influencers.map(inf => 
                                                                           inf.name === influencerDB.name 
                                                                               ? { ...inf, percentage: e.target.value }
                                                                               : inf
                                                                       );
                                                                       setInfluencers(newInfluencers);
                                                                   }}
                                                                   placeholder="0,00"
                                                                   className="h-8 bg-white dark:bg-zinc-900 pr-8"
                                                                   inputMode="decimal"
                                                               />
                                                               <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-xs">%</span>
                                                           </div>
                                                       </div>
                                                   )}
                                               </div>
                                           </div>
                                       </div>
                                   );
                               })}
                           </div>
                       )}
                   </div>

                   <div className="border-b border-gray-100 pb-4 mb-4">
                       <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Marketing de Afiliado</h4>
                       
                       {loadingAffiliates ? (
                           <div className="text-center py-4">
                               <p className="text-xs text-gray-500 dark:text-gray-200">Carregando afiliados...</p>
                           </div>
                       ) : affiliatesDB.length === 0 ? (
                           <div className="text-center py-4 bg-gray-50 rounded-lg dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700">
                               <p className="text-xs text-gray-500 dark:text-gray-200">
                                   Nenhum afiliado cadastrado. Cadastre afiliados primeiro para poder selecioná-los.
                               </p>
                           </div>
                       ) : (
                           <div className="space-y-2">
                               {Object.entries(affiliatesByMarketplace).map(([marketplaceName, mktAffiliates]) => {
                                   const allSelected = mktAffiliates.every(a => affiliates.some(aff => aff.name === a.name));
                                   const someSelected = mktAffiliates.some(a => affiliates.some(aff => aff.name === a.name));
                                   const commission = mktAffiliates[0]?.marketplace_commission_rate ?? mktAffiliates[0]?.percentage ?? 0;
                                   const isOpen = isMarketplaceOpen(marketplaceName);

                                   const toggleAll = (checked: boolean) => {
                                       if (checked) {
                                           const toAdd = mktAffiliates
                                               .filter(a => !affiliates.some(aff => aff.name === a.name))
                                               .map(a => ({ 
                                                   id: crypto.randomUUID(), 
                                                   name: a.name, 
                                                   percentage: (a.marketplace_commission_rate ?? a.percentage).toString(), 
                                                   marketplaceName,
                                                   username: a.tiktok || undefined
                                               }));
                                           setAffiliates([...affiliates, ...toAdd]);
                                       } else {
                                           setAffiliates(affiliates.filter(aff => !mktAffiliates.some(a => a.name === aff.name)));
                                       }
                                   };

                                   return (
                                       <div key={marketplaceName} className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-gray-800/80">
                                           {/* Accordion Header */}
                                           <div className="flex items-center gap-2 px-3 py-2.5">
                                               {/* Marketplace toggle checkbox */}
                                               <Checkbox
                                                   id={`mkt-toggle-${marketplaceName}`}
                                                   checked={allSelected}
                                                   onCheckedChange={(checked) => toggleAll(!!checked)}
                                                   className={someSelected && !allSelected ? 'opacity-60' : ''}
                                                   onClick={(e) => e.stopPropagation()}
                                               />
                                               {/* Clickable title area to expand/collapse */}
                                               <button
                                                   type="button"
                                                   className="flex flex-1 items-center gap-2 text-left"
                                                   onClick={() => toggleMarketplaceOpen(marketplaceName)}
                                               >
                                                   <Music className="w-4 h-4 text-pink-500 flex-shrink-0" />
                                                   <span className="text-sm font-semibold text-gray-800 dark:text-white flex-1">
                                                       {marketplaceName} — Comissão {commission}%
                                                   </span>
                                                   <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">
                                                       {affiliates.filter(aff => mktAffiliates.some(a => a.name === aff.name)).length}/{mktAffiliates.length}
                                                   </span>
                                                   <svg className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                   </svg>
                                               </button>
                                           </div>

                                           {/* Accordion Body */}
                                           {isOpen && (
                                               <div className="px-3 pb-3 space-y-1.5 border-t border-gray-200 dark:border-gray-700 pt-2">
                                                   {mktAffiliates.map((affiliateDB) => {
                                                       const isSelected = affiliates.some(aff => aff.name === affiliateDB.name);
                                                       return (
                                                           <div key={affiliateDB.id} className="p-2 bg-white dark:bg-gray-900/60 rounded-lg border border-gray-100 dark:border-gray-700">
                                                               <div className="flex items-center gap-3">
                                                                   <Checkbox
                                                                       id={`affiliate-${affiliateDB.id}`}
                                                                       checked={isSelected}
                                                                       onCheckedChange={(checked) => {
                                                                           if (checked) {
                                                                               setAffiliates([...affiliates, {
                                                                                   id: crypto.randomUUID(),
                                                                                   name: affiliateDB.name,
                                                                                   percentage: (affiliateDB.marketplace_commission_rate ?? affiliateDB.percentage).toString(),
                                                                                   marketplaceName,
                                                                                   username: affiliateDB.tiktok || undefined
                                                                               }]);
                                                                           } else {
                                                                               setAffiliates(affiliates.filter(aff => aff.name !== affiliateDB.name));
                                                                           }
                                                                       }}
                                                                   />
                                                                   <div className="flex-1 min-w-0">
                                                                       <Label htmlFor={`affiliate-${affiliateDB.id}`} className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer block truncate">
                                                                           {affiliateDB.name}
                                                                       </Label>
                                                                       {affiliateDB.tiktok && (
                                                                           <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                                               <Music className="w-3 h-3" /> {affiliateDB.tiktok}
                                                                           </span>
                                                                       )}
                                                                   </div>
                                                               </div>
                                                           </div>
                                                       );
                                                   })}
                                               </div>
                                           )}
                                       </div>
                                   );
                               })}
                           </div>
                       )}
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-2">
                       <Label className="text-xs text-gray-600 mb-1 block dark:text-white">API de Inteligência Artificial</Label>
                       <div className="flex gap-2">
                           <Button
                               size="sm"
                               variant={organicApi === 'gemini' ? 'default' : 'outline'}
                               onClick={() => setOrganicApi('gemini')}
                               className={`flex-1 text-xs ${organicApi === 'gemini' ? 'bg-indigo-600 dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}`}
                           >
                               Gemini (Grátis)
                           </Button>
                           <Button
                               size="sm"
                               variant={organicApi === 'chatgpt' ? 'default' : 'outline'}
                               onClick={() => setOrganicApi('chatgpt')}
                               className={`flex-1 text-xs ${organicApi === 'chatgpt' ? 'bg-[#fe2c55] text-white hover:bg-[#d91c42] dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}`}
                           >
                               ChatGPT (Pago)
                           </Button>
                       </div>
                       {organicApi === 'chatgpt' && (
                           <p className="text-[10px] text-gray-500 mt-1 dark:text-white">
                               Inclui: OpenAI <a href="https://openai.com/api/pricing/" target="_blank" className="text-blue-600 underline">Ver custos</a>
                           </p>
                       )}
                       {organicApi === 'gemini' && (
                            <p className="text-[10px] text-gray-500 mt-1 dark:text-white">
                                Inclui: Gemini Pro, Gemini Flash, etc. <a href="https://ai.google.dev/pricing" target="_blank" className="text-blue-600 underline">Ver limitações</a>
                            </p>
                        )}
                    </div>
                    <div className="col-span-2">
                        <Label className="text-xs text-gray-600 mb-1 block dark:text-white">Canais</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {channelButtons.map((channel) => {
                            const isSelected = organicChannels.includes(channel.key);
                            return (
                              <Button
                                key={channel.key}
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleOrganicChannelToggle(channel.key, !isSelected)}
                                className={`h-9 justify-center rounded-xl border border-white/70 bg-white text-[11px] font-semibold text-gray-900 shadow-sm transition-colors hover:bg-white/80 dark:bg-zinc-900 dark:text-white dark:border-zinc-700 ${isSelected ? 'bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-500 dark:text-white' : ''}`}
                              >
                                {channel.label}
                              </Button>
                            );
                          })}
                        </div>
                    </div>
                    {selectedOrganicChannels.map((channel) => {
                      if (channel.key === 'whatsapp' || channel.key === 'facebook_group') {
                        const groupLabel = channel.key === 'whatsapp' ? 'Whatsapp' : 'Facebook';
                        return (
                          <div className="col-span-2" key={channel.key}>
                            <Label className="text-xs text-gray-600 mb-1 block dark:text-white">Nome do grupo {groupLabel}</Label>
                            <Input
                              type="text"
                              value={organicChannelNames[channel.key] || ''}
                              onChange={(e) => handleOrganicChannelNameChange(channel.key, e.target.value)}
                              placeholder="Nome do grupo"
                              className="h-8 bg-white"
                            />
                            <Label className="text-xs text-gray-600 mt-2 mb-1 block dark:text-white">Link do grupo {groupLabel}</Label>
                            <Input
                              type="url"
                              value={organicChannelLinks[channel.key] || ''}
                              onChange={(e) => handleOrganicChannelLinkChange(channel.key, e.target.value)}
                              placeholder="https://"
                              className="h-8 bg-white"
                            />
                          </div>
                        );
                      }
                      return (
                        <div className="col-span-2" key={channel.key}>
                          <Label className="text-xs text-gray-600 mb-1 block dark:text-white">Link {channel.label}</Label>
                          <Input
                            type="url"
                            value={organicChannelLinks[channel.key] || ''}
                            onChange={(e) => handleOrganicChannelLinkChange(channel.key, e.target.value)}
                            placeholder="https://"
                            className="h-8 bg-white"
                          />
                        </div>
                      );
                    })}

                    <div className="col-span-2 md:col-span-1">
                       <Label className="text-xs text-gray-600 dark:text-white">Impressão</Label>
                       <div className="group relative inline-block ml-1">
                           <AlertCircle className="w-3 h-3 text-gray-400 inline cursor-help" />
                           <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-32 p-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                               Total de visualizações/impressões
                           </div>
                       </div>
                       <Input
                           type="text"
                           inputMode="decimal"
                           value={orgImpressions}
                           onChange={(e) => setOrgImpressions(e.target.value.replace(/\D/g, ''))} // Integer only usually
                           placeholder="0"
                           className="h-8 bg-gray-100 text-gray-600"
                           readOnly
                       />
                   </div>
                   <div className="col-span-2 md:col-span-1">
                       <Label className="text-xs text-gray-600 dark:text-white">Cliques</Label>
                       <div className="group relative inline-block ml-1">
                           <AlertCircle className="w-3 h-3 text-gray-400 inline cursor-help" />
                           <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-32 p-1 bg-gray-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                               Total de cliques no link
                           </div>
                       </div>
                       <Input
                           type="text"
                           inputMode="decimal"
                           value={orgClicks}
                           onChange={(e) => setOrgClicks(e.target.value.replace(/\D/g, ''))}
                           placeholder="0"
                           className="h-8 bg-gray-100 text-gray-600"
                           readOnly
                       />
                   </div>

                   <div className="col-span-2 md:col-span-1">
                       <Label className="text-xs text-gray-600 dark:text-white">CTR (Automático %)</Label>
                       <Input
                           value={orgImpressions && orgClicks && parseFloat(orgImpressions) > 0 ? ((parseFloat(orgClicks) / parseFloat(orgImpressions)) * 100).toFixed(2) : '0.00'}
                           readOnly
                           className="h-8 bg-gray-100 text-gray-600"
                       />
                   </div>
                   <div className="col-span-2 md:col-span-1">
                       <Label className="text-xs text-gray-600 dark:text-white">Vendas (Total)</Label>
                       <Input
                           type="text"
                           inputMode="decimal"
                           value={orgSales}
                           onChange={(e) => setOrgSales(e.target.value.replace(/\D/g, ''))}
                           placeholder="0"
                           className="h-8 bg-gray-100 text-gray-600"
                           readOnly
                       />
                   </div>
                   
                   <div className="col-span-2">
                       <Label className="text-xs text-gray-600 dark:text-white">Frequência de postagem (vídeos/dia)</Label>
                       <Input
                           type="text"
                           inputMode="decimal"
                           value={orgFreq}
                           onChange={(e) => setOrgFreq(e.target.value.replace(/[^\d.]/g, ''))} // Maybe allow decimals for frequency? 1.5/day?
                           placeholder="1"
                           className="h-8 bg-gray-100 text-gray-600"
                           readOnly
                       />
                   </div>

                   {organicSubMode === 'automated' && (
                       <>
                           <div className="col-span-2">
                               <Label className="text-xs text-gray-600">Plano Kie.ai</Label>
                               <Select value={selectedKiePlan} onValueChange={setSelectedKiePlan} disabled>
                                   <SelectTrigger className="h-8 bg-white">
                                       <SelectValue placeholder="Selecione o plano" />
                                   </SelectTrigger>
                                   <SelectContent>
                                       {Object.entries(KIE_PLANS).map(([key, plan]) => (
                                           <SelectItem key={key} value={key}>{plan.name}</SelectItem>
                                       ))}
                                   </SelectContent>
                               </Select>
                           </div>
                           <div className="col-span-2 md:col-span-1">
                               <Label className="text-xs text-gray-600">Créditos Atuais</Label>
                               <Input
                                   type="number"
                                   value={currentCredits}
                                   onChange={(e) => setCurrentCredits(e.target.value)}
                                   className="h-8 bg-white"
                                   readOnly
                               />
                           </div>
                           <div className="col-span-2 md:col-span-1">
                               <Label className="text-xs text-gray-600">Duração Vídeo (s)</Label>
                               <Input
                                   type="number"
                                   value={videoDuration}
                                   onChange={(e) => setVideoDuration(e.target.value)}
                                   className="h-8 bg-white"
                                   readOnly
                               />
                           </div>
                           <div className="col-span-2">
                               <Label className="text-xs text-gray-600">Modelo IA</Label>
                               <Select value={selectedAiModel} onValueChange={setSelectedAiModel} disabled>
                                   <SelectTrigger className="h-8 bg-white">
                                       <SelectValue placeholder="Selecione o modelo" />
                                   </SelectTrigger>
                                   <SelectContent>
                                       {Object.entries(AI_MODELS).map(([key, model]) => (
                                           <SelectItem key={key} value={key}>{model.name} (${model.costPerSec}/s)</SelectItem>
                                       ))}
                                   </SelectContent>
                               </Select>
                           </div>
                           <div className="col-span-2 flex items-center space-x-2">
                               <Checkbox 
                                   id="useUploadPostFree" 
                                   checked={useUploadPostFree}
                                   onCheckedChange={(checked) => setUseUploadPostFree(checked as boolean)}
                                   disabled
                               />
                               <Label htmlFor="useUploadPostFree" className="text-xs text-gray-600">
                                   Usar Upload/Post Grátis?
                               </Label>
                           </div>
                       </>
                   )}

                   {organicSubMode === 'manual' && organicApi === 'chatgpt' && (
                       <div className="col-span-2">
                           <Label className="text-xs text-gray-600">Custo por vídeo (ChatGPT API)</Label>
                           <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-xs">
                                    $
                                </span>
                               <Input
                                   type="text"
                                   inputMode="decimal"
                                   value={orgCostVideo}
                                   onChange={(e) => handleCurrencyChange(e, setOrgCostVideo)}
                                   placeholder="0,00"
                                   className="h-8 bg-white pl-6"
                                   readOnly
                               />
                           </div>
                       </div>
                   )}

                   {organicSubMode === 'manual' && (
                        <div className="col-span-2">
                            <CollapsibleSection
                                title="Influencer para Vídeo"
                                defaultOpen
                                className="mt-0 border border-gray-100 bg-white dark:bg-zinc-900 dark:border-zinc-800"
                            >
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-600 dark:text-white">Selecione o Influencer</Label>
                                        <Select
                                            value={selectedInfluencerId ?? ''}
                                            onValueChange={(value) => setSelectedInfluencerId?.(value || null)}
                                            disabled={loadingInfluencers}
                                        >
                                            <SelectTrigger className="h-8 bg-white dark:bg-zinc-900">
                                                <SelectValue placeholder={loadingInfluencers ? "Carregando..." : "Selecione um influencer"} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {influencersDB.length === 0 && !loadingInfluencers && (
                                                    <SelectItem value="none" disabled>
                                                        Nenhum influencer cadastrado
                                                    </SelectItem>
                                                )}
                                                {influencersDB.map((influencer) => (
                                                    <SelectItem key={influencer.id} value={influencer.id}>
                                                        {influencer.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {influencersDB.length === 0 && !loadingInfluencers && (
                                            <p className="text-[10px] text-gray-500 mt-1 dark:text-white">
                                                Cadastre influencers na seção "Marketing de Influencer" acima
                                            </p>
                                        )}
                                        {selectedInfluencerId && influencersDB.length > 0 && (
                                            <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-100 dark:bg-zinc-900 dark:border-zinc-800">
                                                <p className="text-[10px] text-blue-600 dark:text-blue-400">
                                                    ✓ Influencer selecionado será usado para gerar vídeos do produto
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CollapsibleSection>
                        </div>
                   )}

                   {organicSubMode === 'manual' && (
                        <div className="col-span-2">
                            <CollapsibleSection
                                title="Video Model"
                                defaultOpen
                                className="mt-0 border border-gray-100 bg-white dark:bg-zinc-900 dark:border-zinc-800"
                            >
                                <div className="space-y-3">
                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            size="sm"
                                            variant={videoGenerationLlm === 'veo3' ? 'default' : 'outline'}
                                            onClick={() => setVideoGenerationLlm?.('veo3')}
                                            className={`flex-1 text-xs ${videoGenerationLlm === 'veo3' ? 'bg-[#fe2c55] hover:bg-[#d91c42] text-white dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}`}
                                        >
                                            Veo3
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={videoGenerationLlm === 'grok' ? 'default' : 'outline'}
                                            onClick={() => setVideoGenerationLlm?.('grok')}
                                            className={`flex-1 text-xs ${videoGenerationLlm === 'grok' ? 'bg-[#fe2c55] hover:bg-[#d91c42] text-white dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}`}
                                        >
                                            Grok
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={videoGenerationLlm === 'sora2' ? 'default' : 'outline'}
                                            onClick={() => setVideoGenerationLlm?.('sora2')}
                                            className={`flex-1 text-xs ${videoGenerationLlm === 'sora2' ? 'bg-[#fe2c55] hover:bg-[#d91c42] text-white dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}`}
                                        >
                                            Sora2
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={videoGenerationLlm === 'wan2' ? 'default' : 'outline'}
                                            onClick={() => setVideoGenerationLlm?.('wan2')}
                                            className={`flex-1 text-xs ${videoGenerationLlm === 'wan2' ? 'bg-[#fe2c55] hover:bg-[#d91c42] text-white dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}`}
                                        >
                                            Wan 2
                                        </Button>
                                    </div>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            size="sm"
                                            variant={videoGenerationLlm === 'copia' ? 'default' : 'outline'}
                                            onClick={() => setVideoGenerationLlm?.('copia')}
                                            className={`flex-1 text-xs ${videoGenerationLlm === 'copia' ? 'bg-[#fe2c55] hover:bg-[#d91c42] text-white dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}`}
                                        >
                                            Cópia
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={videoGenerationLlm === 'kling' ? 'default' : 'outline'}
                                            onClick={() => setVideoGenerationLlm?.('kling')}
                                            className={`flex-1 text-xs ${videoGenerationLlm === 'kling' ? 'bg-[#fe2c55] hover:bg-[#d91c42] text-white dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}`}
                                        >
                                            Kling
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={videoGenerationLlm === 'runway' ? 'default' : 'outline'}
                                            onClick={() => setVideoGenerationLlm?.('runway')}
                                            className={`flex-1 text-xs ${videoGenerationLlm === 'runway' ? 'bg-[#fe2c55] hover:bg-[#d91c42] text-white dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}`}
                                        >
                                            Runway
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={videoGenerationLlm === 'luma' ? 'default' : 'outline'}
                                            onClick={() => setVideoGenerationLlm?.('luma')}
                                            className={`flex-1 text-xs ${videoGenerationLlm === 'luma' ? 'bg-[#fe2c55] hover:bg-[#d91c42] text-white dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}`}
                                        >
                                            Luma
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={videoGenerationLlm === 'pika25' ? 'default' : 'outline'}
                                            onClick={() => setVideoGenerationLlm?.('pika25')}
                                            className={`flex-1 text-xs ${videoGenerationLlm === 'pika25' ? 'bg-[#fe2c55] hover:bg-[#d91c42] text-white dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}`}
                                        >
                                            Pika 2.5
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={videoGenerationLlm === 'seedance' ? 'default' : 'outline'}
                                            onClick={() => setVideoGenerationLlm?.('seedance')}
                                            className={`flex-1 text-xs ${videoGenerationLlm === 'seedance' ? 'bg-[#fe2c55] hover:bg-[#d91c42] text-white dark:bg-[#1D4ED8] dark:hover:bg-[#1D4ED8] dark:text-white' : ''}`}
                                        >
                                            Seedance
                                        </Button>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs text-gray-600 dark:text-white">Modelo de Vídeo</Label>
                                        <Select
                                            value={videoGenerationLlm ?? ''}
                                            onValueChange={(value) => setVideoGenerationLlm?.(value as Exclude<TrafficConfigProps['videoGenerationLlm'], null | undefined>)}
                                        >
                                            <SelectTrigger className="h-8 bg-white dark:bg-zinc-900">
                                                <SelectValue placeholder="Selecione o modelo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="veo3">Veo3</SelectItem>
                                                <SelectItem value="grok">Grok</SelectItem>
                                                <SelectItem value="sora2">Sora2</SelectItem>
                                                <SelectItem value="wan2">Wan 2</SelectItem>
                                                <SelectItem value="copia">Cópia</SelectItem>
                                                <SelectItem value="kling">Kling</SelectItem>
                                                <SelectItem value="runway">Runway</SelectItem>
                                                <SelectItem value="luma">Luma</SelectItem>
                                                <SelectItem value="pika25">Pika 2.5</SelectItem>
                                                <SelectItem value="seedance">Seedance</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {videoGenerationLlm && (
                                        <div className="flex items-center space-x-4 animate-fadeIn bg-white p-2 rounded-md border border-gray-100 dark:bg-zinc-900 dark:border-zinc-800">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="plan-free"
                                                    checked={videoGenerationPlan === 'free'}
                                                    onCheckedChange={(checked) => checked && setVideoGenerationPlan?.('free')}
                                                />
                                                <Label htmlFor="plan-free" className="text-xs text-gray-600 cursor-pointer dark:text-white">
                                                    Plano Gratuito
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="plan-paid"
                                                    checked={videoGenerationPlan === 'paid'}
                                                    onCheckedChange={(checked) => checked && setVideoGenerationPlan?.('paid')}
                                                />
                                                <Label htmlFor="plan-paid" className="text-xs text-gray-600 cursor-pointer dark:text-white">
                                                    Plano Pago
                                                </Label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CollapsibleSection>
                        </div>
                   )}
                   </div>
               </div>
           </CollapsibleSection>
       )}
    </>
  );
};
