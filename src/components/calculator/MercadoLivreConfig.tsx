import React, { useEffect, useState, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatedCheckbox } from "@/components/ui/AnimatedCheckbox";
import { Button } from "@/components/ui/button";
import { Truck, Loader2, Calculator } from 'lucide-react';
import { mercadoLivreTaxes, SUPPLIER_ADDRESSES, SHIPPING_REGIONS } from '../../services/pricingService';
import { formatCurrency, parseCurrency } from '../../utils/currency';
import { calculateShipping, type ProductDimensions } from '../../services/melhorEnvioService';
import { toast } from 'sonner';

interface MercadoLivreConfigProps {
  marketplace: string;
  hasReputation: boolean;
  setHasReputation: (checked: boolean) => void;
  reputationLevel: string;
  setReputationLevel: (value: string) => void;
  adType: string;
  setAdType: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  meliPlus: boolean;
  setMeliPlus: (checked: boolean) => void;
  mlShippingCost: string;
  setMlShippingCost: (value: string) => void;
  mercadoAdsEnabled: boolean;
  setMercadoAdsEnabled: (checked: boolean) => void;
  mercadoAdsManagementMode: 'automatico' | 'personalizado';
  setMercadoAdsManagementMode: (value: 'automatico' | 'personalizado') => void;
  mercadoAdsSolution: 'product_ads' | 'display_ads' | 'brand_ads';
  setMercadoAdsSolution: (value: 'product_ads' | 'display_ads' | 'brand_ads') => void;
  mercadoAdsSelection: string;
  setMercadoAdsSelection: (value: string) => void;
  mercadoAdsDailyBudget: string;
  setMercadoAdsDailyBudget: (value: string) => void;
  mercadoAdsAcosTarget: string;
  setMercadoAdsAcosTarget: (value: string) => void;
  mercadoAdsSalesQuantity: string;
  setMercadoAdsSalesQuantity: (value: string) => void;
  mercadoAdsCpc: string;
  setMercadoAdsCpc: (value: string) => void;
  mercadoAdsConversionRate: string;
  setMercadoAdsConversionRate: (value: string) => void;
  mercadoAdsBudgetType: 'diaria';
  setMercadoAdsBudgetType: (value: 'diaria') => void;
  handleFloatInput: (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Props para cálculo automático de frete
  supplierName?: string;
  weight?: string;
  width?: string;
  height?: string;
  depth?: string;
  manualSellingPrice?: string;
}

export const MercadoLivreConfig: React.FC<MercadoLivreConfigProps> = ({
  marketplace,
  hasReputation,
  setHasReputation,
  reputationLevel,
  setReputationLevel,
  adType,
  setAdType,
  category,
  setCategory,
  meliPlus,
  setMeliPlus,
  mlShippingCost,
  setMlShippingCost,
  mercadoAdsEnabled,
  setMercadoAdsEnabled,
  mercadoAdsManagementMode,
  setMercadoAdsManagementMode,
  mercadoAdsSolution,
  setMercadoAdsSolution,
  mercadoAdsSelection,
  setMercadoAdsSelection,
  mercadoAdsDailyBudget,
  setMercadoAdsDailyBudget,
  mercadoAdsAcosTarget,
  setMercadoAdsAcosTarget,
  mercadoAdsSalesQuantity,
  setMercadoAdsSalesQuantity,
  mercadoAdsCpc,
  setMercadoAdsCpc,
  mercadoAdsConversionRate,
  setMercadoAdsConversionRate,
  mercadoAdsBudgetType,
  setMercadoAdsBudgetType,
  handleFloatInput,
  supplierName,
  weight,
  width,
  height,
  depth,
  manualSellingPrice
}) => {
  const [isCalculatingShipping, setIsCalculatingShipping] = useState(false);
  const [shippingRegion, setShippingRegion] = useState<string>('Equilíbrio');
  const [shippingMethod, setShippingMethod] = useState<string>('');
  const [availableShippingOptions, setAvailableShippingOptions] = useState<Array<{ name: string; price: number; deliveryTime: number }>>([]);

  const conversionValue = parseCurrency(mercadoAdsConversionRate);
  const cpcValue = parseCurrency(mercadoAdsCpc);
  const totalCpaValue = conversionValue > 0 ? (cpcValue / (conversionValue / 100)) : 0;

  // Verifica se todas as condições para calcular frete estão atendidas
  const canCalculateShipping = useCallback(() => {
    if (!supplierName || !weight || !width || !height || !depth) return false;
    
    const weightVal = parseCurrency(weight);
    const widthVal = parseCurrency(width);
    const heightVal = parseCurrency(height);
    const depthVal = parseCurrency(depth);
    
    return weightVal > 0 && widthVal > 0 && heightVal > 0 && depthVal > 0;
  }, [supplierName, weight, width, height, depth]);

  // Verifica se o produto requer frete grátis (preço >= R$ 79)
  const requiresFreeShipping = useCallback(() => {
    if (!manualSellingPrice) return false;
    const price = parseCurrency(manualSellingPrice);
    return price >= 79;
  }, [manualSellingPrice]);

  // Efeito para zerar o frete quando o preço for menor que R$ 79
  useEffect(() => {
    if (!requiresFreeShipping() && mlShippingCost !== '0') {
      setMlShippingCost('0');
      setAvailableShippingOptions([]);
      setShippingMethod('');
    }
  }, [requiresFreeShipping, mlShippingCost, setMlShippingCost]);

  // Calcula o frete automaticamente
  const calculateShippingCost = useCallback(async () => {
    if (!canCalculateShipping() || !supplierName) {
      toast.error('Dados incompletos', {
        description: 'Preencha o fornecedor e as dimensões do produto para calcular o frete.'
      });
      return;
    }

    setIsCalculatingShipping(true);

    try {
      // Obter endereço do fornecedor
      const supplierAddress = SUPPLIER_ADDRESSES[supplierName];
      if (!supplierAddress) {
        throw new Error('Endereço do fornecedor não encontrado');
      }

      // Obter região de destino
      const regions = SHIPPING_REGIONS[supplierName];
      if (!regions || !regions[shippingRegion]) {
        throw new Error('Região de frete não encontrada');
      }

      const destinationPostalCode = regions[shippingRegion].postalCode;

      // Preparar dimensões
      const dimensions: ProductDimensions = {
        weight: parseCurrency(weight!),
        height: parseCurrency(height!),
        width: parseCurrency(width!),
        length: parseCurrency(depth!)
      };

      // Chamar API do Melhor Envio
      const shippingOptions = await calculateShipping(
        supplierAddress.postalCode,
        destinationPostalCode,
        dimensions
      );

      if (shippingOptions.length === 0) {
        throw new Error('Nenhuma opção de frete disponível');
      }

      // Armazenar opções disponíveis
      setAvailableShippingOptions(shippingOptions.map(opt => ({
        name: opt.name,
        price: opt.price,
        deliveryTime: opt.deliveryTime
      })));

      // Se já tem um método selecionado, usar ele. Senão, usar o mais barato
      let selectedOption = shippingOptions[0];
      if (shippingMethod) {
        const found = shippingOptions.find(opt => opt.name === shippingMethod);
        if (found) selectedOption = found;
      }

      // Atualizar o custo de frete
      setMlShippingCost(formatCurrency(selectedOption.price));
      setShippingMethod(selectedOption.name);

      toast.success('Frete calculado com sucesso!', {
        description: `${selectedOption.name}: R$ ${formatCurrency(selectedOption.price)} (${selectedOption.deliveryTime} dias úteis)`
      });

    } catch (error) {
      console.error('Erro ao calcular frete:', error);
      toast.error('Erro ao calcular frete', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setIsCalculatingShipping(false);
    }
  }, [canCalculateShipping, supplierName, shippingRegion, shippingMethod, weight, height, width, depth, setMlShippingCost]);

  // Atualiza o custo quando o método de envio muda
  useEffect(() => {
    if (shippingMethod && availableShippingOptions.length > 0) {
      const selected = availableShippingOptions.find(opt => opt.name === shippingMethod);
      if (selected) {
        setMlShippingCost(formatCurrency(selected.price));
      }
    }
  }, [shippingMethod, availableShippingOptions, setMlShippingCost]);

  useEffect(() => {
    if (marketplace !== 'mercadolivre') return;
    if (!mercadoAdsEnabled) return;
    if (mercadoAdsSalesQuantity !== '0') {
      setMercadoAdsSalesQuantity('0');
    }
    if (mercadoAdsAcosTarget !== '0') {
      setMercadoAdsAcosTarget('0');
    }
  }, [marketplace, mercadoAdsEnabled, mercadoAdsSalesQuantity, mercadoAdsAcosTarget, setMercadoAdsSalesQuantity, setMercadoAdsAcosTarget]);
  
  if (marketplace !== 'mercadolivre') return null;

  return (
    <>
      <div className={`flex items-center space-x-2 p-3 rounded-lg border mb-4 ${
        reputationLevel === 'negative' ? 'bg-red-50 border-red-100 dark:bg-red-900/30 dark:border-red-700' :
        reputationLevel === 'average' ? 'bg-yellow-50 border-yellow-100 dark:bg-yellow-900/30 dark:border-yellow-700' :
        reputationLevel === 'positive' ? 'bg-green-50 border-green-100 dark:bg-green-900/30 dark:border-green-700' :
        'bg-blue-50 border-blue-100 dark:bg-blue-900/30 dark:border-blue-700'
      }`}>
        <AnimatedCheckbox
          id="hasReputation"
          checked={hasReputation}
          onChange={(checked) => setHasReputation(checked)}
          label="Tenho Reputação no Mercado Livre"
        />
        <div className="space-y-0.5 w-full">
            
            {hasReputation && (
              <div className="mt-2 animate-fadeIn">
                 <Select value={reputationLevel} onValueChange={setReputationLevel}>
                    <SelectTrigger className="h-8 text-xs">
                       <SelectValue placeholder="Nível de Reputação" />
                    </SelectTrigger>
                    <SelectContent>
                       <SelectItem value="negative" className="text-red-600 font-bold">Negativa / Sem Cor (Vermelha)</SelectItem>
                       <SelectItem value="average" className="text-yellow-600 font-bold">Média (Amarela)</SelectItem>
                       <SelectItem value="positive" className="text-green-600 font-bold">Positiva (Verde)</SelectItem>
                       <SelectItem value="excellent" className="text-blue-600 font-bold">Mercado Líder / Platinum (Azul)</SelectItem>
                    </SelectContent>
                 </Select>
              </div>
            )}

            {hasReputation ? (
                <p className={`text-[10px] mt-1 font-medium ${
                    reputationLevel === 'negative' ? 'text-red-700 dark:text-red-100' :
                    reputationLevel === 'average' ? 'text-yellow-700 dark:text-yellow-100' :
                    reputationLevel === 'positive' ? 'text-green-700 dark:text-green-100' :
                    'text-blue-700 dark:text-blue-100'
                }`}>
                    {reputationLevel === 'negative' && "⚠️ Cuidado: Baixa exposição e bloqueios possíveis."}
                    {reputationLevel === 'average' && "⚠️ Atenção: Exposição média, busque melhorar."}
                    {reputationLevel === 'positive' && "✅ Ótimo: Boa exposição e confiança."}
                    {reputationLevel === 'excellent' && "💎 Excelente: Máxima exposição e benefícios de envios."}
                </p>
            ) : (
                <p className="text-[10px] text-gray-600 dark:text-white font-medium">Sem reputação: Menor exposição, frete mais caro para o vendedor, limitações de envios</p>
            )}
        </div>
      </div>

      <div className="flex items-center space-x-2 p-3 rounded-lg border mb-4 bg-gray-50 border-gray-200 dark:bg-pink-900/30 dark:border-pink-700">
        <AnimatedCheckbox
          id="meliPlus"
          checked={meliPlus}
          onChange={(checked) => setMeliPlus(checked)}
          label="Meli+"
        />
        <div className="space-y-0.5 w-full">
            <p className="text-[10px] text-gray-600 dark:text-white">
              Comissão menor e frete com desconto quando disponível
            </p>
        </div>
      </div>

      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label className="text-sm font-semibold text-gray-800 dark:text-white">
          Tipo de Anúncio
        </Label>
        <Select value={adType} onValueChange={setAdType}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gratis">Grátis (0% - Sem visibilidade)</SelectItem>
            <SelectItem value="classico">Clássico (11.5% a 14.5% + taxa fixa)</SelectItem>
            <SelectItem value="premium">Premium (16.5% a 19.5% + taxa fixa)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-[10px] text-gray-500 dark:text-gray-300 mt-1">
            Modalidades: Clássico (Visibilidade média) | Premium (Máxima visibilidade + 12x sem juros)
        </p>
      </div>

      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label className="text-sm font-semibold text-gray-800 dark:text-white">
          Categoria do Produto
        </Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(mercadoLivreTaxes[adType] || {}).map(([key, value]) => {
              const adjustedRate = value.rate === 0
                ? 0
                : meliPlus
                  ? Math.max(9, value.rate - 2)
                  : value.rate;
              return (
              <SelectItem key={key} value={key}>
                {value.name} ({adjustedRate}%)
              </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-xl border border-yellow-200 dark:border-yellow-800 mt-2">
         <p className="text-xs text-yellow-800 dark:text-yellow-200 font-semibold mb-2">Prazos de Recebimento:</p>
         <ul className="text-[10px] text-yellow-700 dark:text-yellow-300 space-y-1 mb-3">
            <li>• <strong>Sem Reputação / Iniciante:</strong> 10 a 28 dias após a entrega</li>
            <li>• <strong>Líder / Gold / Platinum:</strong> 5 dias após a entrega (ou na hora com Mercado Pago)</li>
         </ul>

         {/* Campo de Frete Mercado Livre */}
         <div className="mb-3 animate-fadeIn space-y-3">
            {/* Seleção de Região */}
            {requiresFreeShipping() && supplierName && SHIPPING_REGIONS[supplierName] && (
              <div>
                <Label htmlFor="shippingRegion" className="text-xs font-semibold text-gray-800 dark:text-white">
                  Região de Destino
                </Label>
                <Select value={shippingRegion} onValueChange={setShippingRegion}>
                  <SelectTrigger className="h-8 text-sm mt-1">
                    <SelectValue placeholder="Selecione a região" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SHIPPING_REGIONS[supplierName]).map(([key, region]) => (
                      <SelectItem key={key} value={key}>
                        {key} ({region.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Botão para calcular frete */}
            {requiresFreeShipping() && canCalculateShipping() && (
              <Button
                type="button"
                onClick={calculateShippingCost}
                disabled={isCalculatingShipping}
                className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold"
              >
                {isCalculatingShipping ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Calculando...
                  </>
                ) : (
                  <>
                    <Calculator className="w-4 h-4 mr-2" />
                    Calcular Frete Automaticamente
                  </>
                )}
              </Button>
            )}

            {/* Seleção de Método de Envio */}
            {availableShippingOptions.length > 0 && (
              <div>
                <Label htmlFor="shippingMethod" className="text-xs font-semibold text-gray-800 dark:text-white">
                  Método de Envio
                </Label>
                <Select value={shippingMethod} onValueChange={setShippingMethod}>
                  <SelectTrigger className="h-8 text-sm mt-1">
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableShippingOptions.map((option) => (
                      <SelectItem key={option.name} value={option.name}>
                        {option.name} - R$ {formatCurrency(option.price)} ({option.deliveryTime} dias úteis)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Label htmlFor="mlShippingCost" className="text-xs font-semibold text-gray-800 dark:text-white flex items-center gap-1">
               <Truck className="w-3 h-3" /> Custo de Frete (Pago por você)
            </Label>
            <div className="relative">
               <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-200 font-semibold">R$</span>
               <Input
                  id="mlShippingCost"
                  type="text"
                  inputMode="decimal"
                  value={mlShippingCost}
                  onChange={(e) => handleFloatInput(setMlShippingCost)(e)}
                  className="pl-8 h-8 text-sm bg-white dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="0,00"
                  disabled={!requiresFreeShipping()}
               />
            </div>
            {requiresFreeShipping() ? (
              <p className="text-[10px] text-gray-500 dark:text-gray-200">
                *Obrigatório para produtos &gt; R$ 79 (Frete Grátis)
              </p>
            ) : (
              <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">
                ⚠️ Frete grátis é obrigatório apenas para produtos com preço ≥ R$ 79,00
              </p>
            )}
            {requiresFreeShipping() && !canCalculateShipping() && (
              <p className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold">
                ⚠️ Preencha as dimensões do produto para calcular o frete automaticamente
              </p>
            )}
         </div>

         <p className="text-xs text-yellow-800 dark:text-yellow-200 font-semibold mb-2">Regras de Custo Fixo (Atualizado):</p>
         <ul className="text-[10px] text-yellow-700 dark:text-yellow-300 space-y-1">
            <li>• &lt; R$ 12,50: Metade do preço de venda</li>
            <li>• R$ 12,50 - R$ 79: R$ 6,00</li>
            <li>• &gt; R$ 79: Isento de taxa fixa</li>
         </ul>
      </div>
      <div className="mt-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Checkbox
            id="mercadoAdsEnabled"
            checked={mercadoAdsEnabled}
            onCheckedChange={(checked) => setMercadoAdsEnabled(checked as boolean)}
          />
          <Label htmlFor="mercadoAdsEnabled" className="font-bold text-gray-800 dark:text-white cursor-pointer">
            Calcular Mercado Ads
          </Label>
        </div>
        {mercadoAdsEnabled && (
          <div className="grid grid-cols-2 gap-4 animate-fadeIn">
            <div className="col-span-2">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Modo de Gestão
              </Label>
              <Select value={mercadoAdsManagementMode} onValueChange={(value) => setMercadoAdsManagementMode(value as 'automatico' | 'personalizado')}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Selecione o modo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatico">Automático</SelectItem>
                  <SelectItem value="personalizado">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Solução
              </Label>
              <Select value={mercadoAdsSolution} onValueChange={(value) => setMercadoAdsSolution(value as 'product_ads' | 'display_ads' | 'brand_ads')}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Selecione a solução" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product_ads">Product Ads</SelectItem>
                  <SelectItem value="display_ads">Display Ads</SelectItem>
                  <SelectItem value="brand_ads">Brand Ads</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Seleção
              </Label>
              <Input
                type="text"
                value={mercadoAdsSelection}
                onChange={(e) => setMercadoAdsSelection(e.target.value)}
                className="h-8 text-sm bg-white dark:bg-gray-800 dark:text-white"
                placeholder="Produto, catálogo ou campanha"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Orçamento Total
              </Label>
              <Input
                type="text"
                inputMode="decimal"
                value={mercadoAdsDailyBudget}
                onChange={(e) => handleFloatInput(setMercadoAdsDailyBudget)(e)}
                className="h-8 text-sm bg-white dark:bg-gray-800 dark:text-white"
                placeholder="0,00"
              />
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1 mt-3">
                Forma
              </Label>
              <Select value={mercadoAdsBudgetType} onValueChange={(value) => setMercadoAdsBudgetType(value as 'diaria')}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Selecione a forma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="diaria">Diária</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-[10px] text-gray-600 dark:text-gray-300 mt-2">
                Custo Total CPA: R$ {formatCurrency(totalCpaValue || 0)}
              </p>
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                CPC Médio
              </Label>
              <Input
                type="text"
                inputMode="decimal"
                value={mercadoAdsCpc}
                onChange={(e) => handleFloatInput(setMercadoAdsCpc)(e)}
                className="h-8 text-sm bg-white dark:bg-gray-800 dark:text-white"
                placeholder="0,00"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Taxa de Conversão (%)
              </Label>
              <Input
                type="text"
                inputMode="decimal"
                value={mercadoAdsConversionRate}
                onChange={(e) => handleFloatInput(setMercadoAdsConversionRate)(e)}
                className="h-8 text-sm bg-white dark:bg-gray-800 dark:text-white"
                placeholder="0,00"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                ACOS Alvo (%)
              </Label>
              <Input
                type="text"
                inputMode="decimal"
                value={mercadoAdsAcosTarget}
                onChange={(e) => handleFloatInput(setMercadoAdsAcosTarget)(e)}
                className="h-8 text-sm bg-white dark:bg-gray-800 dark:text-white"
                placeholder="0"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">
                Vendas
              </Label>
              <Input
                type="text"
                inputMode="numeric"
                value="0"
                onChange={() => undefined}
                className="h-8 text-sm bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-200"
                placeholder="0"
                disabled
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
};
