import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { amazonCategories } from '../../services/amazonCategories';
import type { AmazonPlanType } from '../../services/amazonCategories';
import { handleCurrencyChange } from '../../utils/currency';

interface AmazonConfigProps {
  marketplace: string;
  amazonPlan: AmazonPlanType;
  setAmazonPlan: (plan: AmazonPlanType) => void;
  amazonCategory: string;
  setAmazonCategory: (category: string) => void;
  marketplaceShippingCost: string;
  setMarketplaceShippingCost: (value: string) => void;
}

export const AmazonConfig: React.FC<AmazonConfigProps> = ({
  marketplace,
  amazonPlan,
  setAmazonPlan,
  amazonCategory,
  setAmazonCategory,
  marketplaceShippingCost,
  setMarketplaceShippingCost
}) => {
  if (marketplace !== 'amazon') return null;

  return (
    <>
      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
        <Label className="text-sm font-semibold text-gray-800 dark:text-white">
          Plano Amazon
        </Label>
        <Select value={amazonPlan} onValueChange={setAmazonPlan}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o plano" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="individual">Individual (R$ 2,00/item)</SelectItem>
            <SelectItem value="profissional">Profissional (R$ 19,00/mês)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
        <Label className="text-sm font-semibold text-gray-800 dark:text-white">
          Categoria Amazon
        </Label>
        <Select value={amazonCategory} onValueChange={setAmazonCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a categoria" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(amazonCategories).map(([key, cat]) => (
              <SelectItem key={key} value={key}>
                {cat.name} ({cat.commission}%)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
        <Label htmlFor="amazonShipping" className="text-sm font-semibold text-gray-800 dark:text-white">
          Valor do Frete (R$)
        </Label>
        <div className="relative">
          <Input
            id="amazonShipping"
            type="text"
            inputMode="decimal"
            value={marketplaceShippingCost}
            onChange={(e) => handleCurrencyChange(e, setMarketplaceShippingCost)}
            placeholder="0,00"
            className="dark:bg-gray-800 dark:text-white"
          />
        </div>
      </div>
    </>
  );
};
