import React, { useEffect, useMemo } from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { AnimatedCheckbox } from "@/components/ui/AnimatedCheckbox";
import { Button } from "@/components/ui/button";
import { DollarSign } from 'lucide-react';
import { shopeeCategories } from '../../services/pricingService';
import { formatCurrency, handleCurrencyChange, parseCurrency } from '../../utils/currency';

interface ShopeeConfigProps {
  marketplace: string;
  category: string;
  handleShopeeCategoryChange: (value: string) => void;
  extraCommission: string;
  setExtraCommission: (value: string) => void;
  shippingOption: string;
  setShippingOption: (value: string) => void;
  shopeeSellerType: 'cpf' | 'cnpj';
  useShopeeAds: boolean;
  handleShopeeAdsChange: (checked: boolean) => void;
  adsCPC: string;
  setAdsCPC: (value: string) => void;
  dailyBudget: string;
  setDailyBudget: (value: string) => void;
  salesQuantity: string;
  setSalesQuantity: (value: string) => void;
  shopeeStoreCouponEnabled: boolean;
  setShopeeStoreCouponEnabled: (checked: boolean) => void;
  shopeeStoreCouponValue: string;
  setShopeeStoreCouponValue: (value: string) => void;
  shopeeStoreCouponType: 'percent' | 'fixed';
  setShopeeStoreCouponType: (value: 'percent' | 'fixed') => void;
  shopeeProductCouponEnabled: boolean;
  setShopeeProductCouponEnabled: (checked: boolean) => void;
  shopeeProductCouponValue: string;
  setShopeeProductCouponValue: (value: string) => void;
  shopeeProductCouponType: 'percent' | 'fixed';
  setShopeeProductCouponType: (value: 'percent' | 'fixed') => void;
  shopeeFollowerCouponEnabled: boolean;
  setShopeeFollowerCouponEnabled: (checked: boolean) => void;
  shopeeFollowerCouponValue: string;
  setShopeeFollowerCouponValue: (value: string) => void;
  shopeeFollowerCouponType: 'percent' | 'fixed';
  setShopeeFollowerCouponType: (value: 'percent' | 'fixed') => void;
  shopeeSellerVoucherEnabled: boolean;
  setShopeeSellerVoucherEnabled: (checked: boolean) => void;
  shopeeSellerVoucherValue: string;
  setShopeeSellerVoucherValue: (value: string) => void;
  shopeeSellerVoucherType: 'percent' | 'fixed';
  setShopeeSellerVoucherType: (value: 'percent' | 'fixed') => void;
  shopeeTotalBudget: string;
  setShopeeTotalBudget: (value: string) => void;
  shopeeStartDate: string;
  setShopeeStartDate: (value: string) => void;
  shopeeEndDate: string;
  setShopeeEndDate: (value: string) => void;
  shopeeAdType: string;
  setShopeeAdType: (value: string) => void;
  shopeeBidType: string;
  setShopeeBidType: (value: string) => void;
  shopeeKeywordInput: string;
  setShopeeKeywordInput: (value: string) => void;
  shopeeKeywords: string[];
  setShopeeKeywords: (value: string[]) => void;
  shopeeMaxCpc: string;
  setShopeeMaxCpc: (value: string) => void;
  availableMarketingCapital: number;
  remainingMarketingCapital: number;
}

export const ShopeeConfig: React.FC<ShopeeConfigProps> = ({
  marketplace,
  category,
  handleShopeeCategoryChange,
  extraCommission: _extraCommission,
  setExtraCommission: _setExtraCommission,
  shippingOption: _shippingOption,
  setShippingOption: _setShippingOption,
  shopeeSellerType: _shopeeSellerType,
  useShopeeAds,
  handleShopeeAdsChange,
  adsCPC,
  setAdsCPC,
  dailyBudget,
  setDailyBudget,
  salesQuantity,
  setSalesQuantity,
  shopeeStoreCouponEnabled,
  setShopeeStoreCouponEnabled,
  shopeeStoreCouponValue,
  setShopeeStoreCouponValue,
  shopeeStoreCouponType,
  setShopeeStoreCouponType,
  shopeeProductCouponEnabled,
  setShopeeProductCouponEnabled,
  shopeeProductCouponValue,
  setShopeeProductCouponValue,
  shopeeProductCouponType,
  setShopeeProductCouponType,
  shopeeFollowerCouponEnabled,
  setShopeeFollowerCouponEnabled,
  shopeeFollowerCouponValue,
  setShopeeFollowerCouponValue,
  shopeeFollowerCouponType,
  setShopeeFollowerCouponType,
  shopeeSellerVoucherEnabled,
  setShopeeSellerVoucherEnabled,
  shopeeSellerVoucherValue,
  setShopeeSellerVoucherValue,
  shopeeSellerVoucherType,
  setShopeeSellerVoucherType,
  shopeeTotalBudget,
  setShopeeTotalBudget,
  shopeeStartDate,
  setShopeeStartDate,
  shopeeEndDate,
  setShopeeEndDate,
  shopeeAdType,
  setShopeeAdType,
  shopeeBidType,
  setShopeeBidType,
  shopeeKeywordInput,
  setShopeeKeywordInput,
  shopeeKeywords,
  setShopeeKeywords,
  shopeeMaxCpc,
  setShopeeMaxCpc,
  availableMarketingCapital,
  remainingMarketingCapital
}) => {
  const formatDateInputBr = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 8);
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  };
  const formatDateToBr = (value?: string) => {
    if (!value) return '';
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return value;
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-');
      return `${day}/${month}/${year}`;
    }
    return '';
  };
  const formatDateToIso = (value?: string) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
      const [day, month, year] = value.split('/');
      return `${year}-${month}-${day}`;
    }
    return '';
  };
  const fixedFeeLabel = 'Por faixa de preço (R$4–R$26)';
  const totalBudgetValue = parseCurrency(shopeeTotalBudget);
  const startDateIso = formatDateToIso(shopeeStartDate);
  const endDateIso = formatDateToIso(shopeeEndDate);
  const startDateValue = useMemo(() => (startDateIso ? new Date(startDateIso) : null), [startDateIso]);
  const endDateValue = useMemo(() => (endDateIso ? new Date(endDateIso) : null), [endDateIso]);
  const validDateRange = useMemo(() => {
    if (!startDateValue || !endDateValue) return false;
    return endDateValue >= startDateValue;
  }, [startDateValue, endDateValue]);
  const totalDays = useMemo(() => {
    if (!validDateRange || !startDateValue || !endDateValue) return 0;
    const diff = Math.floor((endDateValue.getTime() - startDateValue.getTime()) / 86400000);
    return diff + 1;
  }, [validDateRange, startDateValue, endDateValue]);
  const shouldAutoDailyBudget = useShopeeAds && totalBudgetValue > 0 && totalDays > 0;

  useEffect(() => {
    if (!shouldAutoDailyBudget) return;
    const daily = totalBudgetValue / totalDays;
    const formatted = formatCurrency(Number.isFinite(daily) ? daily : 0);
    if (formatted && formatted !== dailyBudget) {
      setDailyBudget(formatted);
    }
  }, [dailyBudget, setDailyBudget, shouldAutoDailyBudget, totalBudgetValue, totalDays]);

  const couponPlaceholder = (type: 'fixed' | 'percent') => type === 'percent' ? '0' : '0,00';
  const couponSuffix = (type: 'fixed' | 'percent') => type === 'percent' ? '%' : 'R$';
  const canEditDailyBudget = useShopeeAds && !shouldAutoDailyBudget;
  const handleShopeeTotalBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleCurrencyChange(e, (val) => {
      const numericValue = parseCurrency(val);
      const limitedValue = availableMarketingCapital > 0 ? Math.min(numericValue, availableMarketingCapital) : numericValue;
      setShopeeTotalBudget(limitedValue === numericValue ? val : formatCurrency(limitedValue));
    });
  };

  if (marketplace !== 'shopee') return null;

  return (
    <>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label className="text-sm font-semibold text-gray-800 dark:text-white">
          Categoria (Estimativa de CPC)
        </Label>
        <Select value={category} onValueChange={handleShopeeCategoryChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(shopeeCategories).map(([key, value]) => (
              <SelectItem key={key} value={key}>
                {value.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4 bg-gray-50 dark:bg-gray-900/20 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
        <h3 className="font-semibold text-gray-800 dark:text-white text-sm flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-orange-500" />
          Taxas Shopee
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600 dark:text-gray-300">Comissão</Label>
            <div className="relative">
              <Input value="20% (até R$79,99) / 14% (acima)" disabled className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 h-9 font-medium text-xs" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-gray-600 dark:text-gray-300">Taxa Fixa (por item)</Label>
            <div className="relative">
              <Input value={fixedFeeLabel} disabled className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 h-9 font-medium text-xs" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/30 px-3 py-2 text-xs text-orange-700 dark:text-orange-300 space-y-0.5">
          <div className="font-semibold mb-1">Faixas de preço (novas regras 2025):</div>
          <div>≤ R$79,99 → 20% + R$4</div>
          <div>R$80–R$99,99 → 14% + R$16</div>
          <div>R$100–R$199,99 → 14% + R$20</div>
          <div>R$200–R$499,99 → 14% + R$26</div>
          <div>≥ R$500 → 14% + R$26</div>
        </div>
        <p className="text-[10px] text-gray-500 dark:text-gray-400">*Frete Grátis obrigatório — incluso nas taxas acima</p>

        <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-900/40 rounded-lg border border-gray-200 dark:border-gray-800">
          <div className="space-y-0.5">
            <Label htmlFor="free-shipping" className="text-sm font-medium text-red-500 dark:text-red-400">
              Programa de Frete Grátis
            </Label>
            <p className="text-xs text-gray-500 dark:text-gray-400">Obrigatório — incluso nas taxas por faixa de preço</p>
          </div>
          <AnimatedCheckbox
            id="free-shipping"
            checked={true}
            onChange={() => {/* obrigatório, não pode desmarcar */}}
            label=""
          />
        </div>
      </div>

      <div className="space-y-3 bg-white dark:bg-gray-900/40 p-4 rounded-xl border border-gray-200 dark:border-gray-800 mt-3">
        <h4 className="text-sm font-semibold text-gray-800 dark:text-white">Cupons e Voucher</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="shopeeStoreCoupon" className="text-sm text-gray-700 dark:text-gray-300">Cupom de Loja</Label>
            <Checkbox
              id="shopeeStoreCoupon"
              checked={shopeeStoreCouponEnabled}
              onCheckedChange={(checked) => setShopeeStoreCouponEnabled(checked as boolean)}
            />
          </div>
          {shopeeStoreCouponEnabled && (
            <div className="grid grid-cols-3 gap-2">
              <Select value={shopeeStoreCouponType} onValueChange={(value) => setShopeeStoreCouponType(value as 'percent' | 'fixed')}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">R$</SelectItem>
                  <SelectItem value="percent">%</SelectItem>
                </SelectContent>
              </Select>
              <div className="col-span-2 relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={shopeeStoreCouponValue}
                  onChange={(e) => handleCurrencyChange(e, setShopeeStoreCouponValue)}
                  placeholder={couponPlaceholder(shopeeStoreCouponType)}
                  className="h-8 text-sm pl-7 dark:bg-gray-800 dark:text-white"
                />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 dark:text-gray-400">
                  {couponSuffix(shopeeStoreCouponType)}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="shopeeProductCoupon" className="text-sm text-gray-700 dark:text-gray-300">Cupom de Produto</Label>
            <Checkbox
              id="shopeeProductCoupon"
              checked={shopeeProductCouponEnabled}
              onCheckedChange={(checked) => setShopeeProductCouponEnabled(checked as boolean)}
            />
          </div>
          {shopeeProductCouponEnabled && (
            <div className="grid grid-cols-3 gap-2">
              <Select value={shopeeProductCouponType} onValueChange={(value) => setShopeeProductCouponType(value as 'percent' | 'fixed')}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">R$</SelectItem>
                  <SelectItem value="percent">%</SelectItem>
                </SelectContent>
              </Select>
              <div className="col-span-2 relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={shopeeProductCouponValue}
                  onChange={(e) => handleCurrencyChange(e, setShopeeProductCouponValue)}
                  placeholder={couponPlaceholder(shopeeProductCouponType)}
                  className="h-8 text-sm pl-7"
                />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  {couponSuffix(shopeeProductCouponType)}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="shopeeFollowerCoupon" className="text-sm text-gray-700 dark:text-gray-300">Cupom de Seguidor</Label>
            <Checkbox
              id="shopeeFollowerCoupon"
              checked={shopeeFollowerCouponEnabled}
              onCheckedChange={(checked) => setShopeeFollowerCouponEnabled(checked as boolean)}
            />
          </div>
          {shopeeFollowerCouponEnabled && (
            <div className="grid grid-cols-3 gap-2">
              <Select value={shopeeFollowerCouponType} onValueChange={(value) => setShopeeFollowerCouponType(value as 'percent' | 'fixed')}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">R$</SelectItem>
                  <SelectItem value="percent">%</SelectItem>
                </SelectContent>
              </Select>
              <div className="col-span-2 relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={shopeeFollowerCouponValue}
                  onChange={(e) => handleCurrencyChange(e, setShopeeFollowerCouponValue)}
                  placeholder={couponPlaceholder(shopeeFollowerCouponType)}
                  className="h-8 text-sm pl-7"
                />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  {couponSuffix(shopeeFollowerCouponType)}
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="shopeeSellerVoucher" className="text-sm text-gray-700 dark:text-gray-300">Voucher de Vendedor</Label>
            <Checkbox
              id="shopeeSellerVoucher"
              checked={shopeeSellerVoucherEnabled}
              onCheckedChange={(checked) => setShopeeSellerVoucherEnabled(checked as boolean)}
            />
          </div>
          {shopeeSellerVoucherEnabled && (
            <div className="grid grid-cols-3 gap-2">
              <Select value={shopeeSellerVoucherType} onValueChange={(value) => setShopeeSellerVoucherType(value as 'percent' | 'fixed')}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">R$</SelectItem>
                  <SelectItem value="percent">%</SelectItem>
                </SelectContent>
              </Select>
              <div className="col-span-2 relative">
                <Input
                  type="text"
                  inputMode="decimal"
                  value={shopeeSellerVoucherValue}
                  onChange={(e) => handleCurrencyChange(e, setShopeeSellerVoucherValue)}
                  placeholder={couponPlaceholder(shopeeSellerVoucherType)}
                  className="h-8 text-sm pl-7"
                />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">
                  {couponSuffix(shopeeSellerVoucherType)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-pink-50 dark:bg-pink-900/20 p-4 rounded-xl border border-pink-100 dark:border-pink-800 mt-2">
        <AnimatedCheckbox
          id="useShopeeAds"
          checked={useShopeeAds}
          onChange={(checked) => handleShopeeAdsChange(checked)}
          label="Calcular Shopee Ads"
          className="mb-3"
        />

        {useShopeeAds && (
          <div className="grid grid-cols-2 gap-4 animate-fadeIn">
            <div className="col-span-2">
              <Label htmlFor="shopeeAdType" className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Anúncio
              </Label>
              <Select value={shopeeAdType} onValueChange={setShopeeAdType}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="descoberta">Descoberta</SelectItem>
                  <SelectItem value="pesquisa">Pesquisa</SelectItem>
                  <SelectItem value="ofertas">Ofertas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="shopeeBidType" className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Tipo de Lance
              </Label>
              <Select value={shopeeBidType} onValueChange={setShopeeBidType}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="automatico">Automático</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="adsCPC" className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                CPC Médio (R$)
              </Label>
              <Input
                id="adsCPC"
                type="text"
                inputMode="decimal"
                value={adsCPC}
                onChange={(e) => handleCurrencyChange(e, setAdsCPC)}
                className="h-8 text-sm dark:bg-gray-800 dark:text-white"
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="shopeeMaxCpc" className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                CPC Máximo (R$)
              </Label>
              <Input
                id="shopeeMaxCpc"
                type="text"
                inputMode="decimal"
                value={shopeeMaxCpc}
                onChange={(e) => handleCurrencyChange(e, setShopeeMaxCpc)}
                className="h-8 text-sm dark:bg-gray-800 dark:text-white"
                placeholder="0,00"
              />
            </div>
            <div>
              <Label htmlFor="shopeeTotalBudget" className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Orçamento Total (R$)
              </Label>
              <Input
                id="shopeeTotalBudget"
                type="text"
                inputMode="decimal"
                value={shopeeTotalBudget}
                onChange={handleShopeeTotalBudgetChange}
                className="h-8 text-sm dark:bg-gray-800 dark:text-white"
                placeholder="0,00"
              />
            </div>
            <div className="col-span-2 text-xs text-gray-600 dark:text-gray-400">
              Você tem R$ {formatCurrency(remainingMarketingCapital)} de Capital de Marketing
            </div>
            <div>
              <Label htmlFor="dailyBudget" className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Orçamento Diário (R$)
              </Label>
              <Input
                id="dailyBudget"
                type="text"
                inputMode="decimal"
                value={dailyBudget}
                onChange={(e) => handleCurrencyChange(e, setDailyBudget)}
                disabled={!canEditDailyBudget}
                className={`h-8 text-sm dark:bg-gray-800 dark:text-white ${parseFloat(dailyBudget.replace(',','.')) < 1 ? 'border-red-500' : ''}`}
                placeholder="1,00"
              />
            </div>
            <div>
              <Label htmlFor="shopeeStartDate" className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Data de Início
              </Label>
              <Input
                id="shopeeStartDate"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                value={formatDateToBr(shopeeStartDate)}
                onChange={(e) => setShopeeStartDate(formatDateInputBr(e.target.value))}
                className="h-8 text-sm dark:bg-gray-800 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="shopeeEndDate" className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Data de Término
              </Label>
              <Input
                id="shopeeEndDate"
                inputMode="numeric"
                placeholder="dd/mm/aaaa"
                value={formatDateToBr(shopeeEndDate)}
                onChange={(e) => setShopeeEndDate(formatDateInputBr(e.target.value))}
                className="h-8 text-sm dark:bg-gray-800 dark:text-white"
              />
            </div>
            {!validDateRange && (shopeeStartDate || shopeeEndDate) && (
              <div className="col-span-2 text-xs text-red-500 font-bold">
                * Data final precisa ser igual ou posterior à inicial
              </div>
            )}
            {shouldAutoDailyBudget && (
              <div className="col-span-2 text-[10px] text-gray-600 dark:text-gray-400">
                Orçamento diário calculado automaticamente com base nas datas.
              </div>
            )}
            <div className="col-span-2">
              <Label htmlFor="shopeeKeywords" className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Palavras-chave
              </Label>
              <div className="flex gap-2">
                <Input
                  id="shopeeKeywords"
                  type="text"
                  value={shopeeKeywordInput}
                  onChange={(e) => setShopeeKeywordInput(e.target.value)}
                  className="h-8 text-sm dark:bg-gray-800 dark:text-white"
                  placeholder="Ex: camisa, algodão"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const value = shopeeKeywordInput.trim();
                    if (!value) return;
                    const entries = value.split(',').map((item) => item.trim()).filter(Boolean);
                    const merged = [...shopeeKeywords, ...entries].filter((item, index, arr) => arr.indexOf(item) === index);
                    setShopeeKeywords(merged);
                    setShopeeKeywordInput('');
                  }}
                >
                  Adicionar
                </Button>
              </div>
              {shopeeKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {shopeeKeywords.map((keyword) => (
                    <button
                      type="button"
                      key={keyword}
                      onClick={() => setShopeeKeywords(shopeeKeywords.filter((item) => item !== keyword))}
                      className="text-[10px] px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500"
                    >
                      {keyword}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {parseFloat(dailyBudget.replace(',','.')) < 1 && (
                <div className="col-span-2 text-xs text-red-500 font-bold">
                    * Mínimo de R$ 1,00
                </div>
            )}
            <div className="col-span-2">
               <Label htmlFor="salesQuantity" className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Quantidade de Vendas (Para Cálculo de CR)
              </Label>
               <Input
                id="salesQuantity"
                type="text"
                inputMode="decimal"
                value={salesQuantity}
                onChange={(e) => setSalesQuantity(e.target.value.replace(/\D/g, ''))}
                disabled
                className="h-8 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                placeholder="0"
              />
            </div>
            <div className="col-span-2 text-[10px] text-gray-500 dark:text-gray-400 space-y-2 border-t dark:border-gray-700 pt-2 mt-2">
               <p><strong>ROI (Retorno sobre Investimento):</strong></p>
               <ul className="list-disc pl-4 space-y-1">
                    <li>1 - 3: Baixo/Arriscado</li>
                    <li>4 - 6: Bom</li>
                    <li>7+: Excelente</li>
               </ul>
               <p><strong>ACOS (Custo de Venda):</strong></p>
               <ul className="list-disc pl-4 space-y-1">
                    <li>15% - 30%: Excelente</li>
                    <li>30% - 50%: Moderado</li>
                    <li>50%+: Alto</li>
               </ul>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
