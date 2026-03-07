import React from 'react';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { handleCurrencyChange } from '../../utils/currency';

interface EnjoeiConfigProps {
  marketplace: string;
  enjoeiAdType: string;
  setEnjoeiAdType: (val: string) => void;
  enjoeiInactivityMonths: string;
  setEnjoeiInactivityMonths: (val: string) => void;
  marketplaceShippingCost: string;
  setMarketplaceShippingCost: (value: string) => void;
}

export const EnjoeiConfig: React.FC<EnjoeiConfigProps> = ({
  marketplace,
  enjoeiAdType,
  setEnjoeiAdType,
  enjoeiInactivityMonths,
  setEnjoeiInactivityMonths,
  marketplaceShippingCost,
  setMarketplaceShippingCost
}) => {
  if (marketplace !== 'enjoei') return null;

  return (
    <div className="space-y-4 border-t pt-4 mt-4 animate-fadeIn">
      <h3 className="font-semibold text-lg text-purple-700 flex items-center gap-2">
        Configurações Enjoei
      </h3>
      
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label className="text-sm font-semibold text-gray-800">
          Tipo de Anúncio
        </Label>
        <Select value={enjoeiAdType} onValueChange={setEnjoeiAdType}>
          <SelectTrigger className="bg-white border-purple-200">
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="classico">Clássico (12% + Taxa Fixa)</SelectItem>
            <SelectItem value="turbinado">Turbinado (18% + Taxa Fixa)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500">
            {enjoeiAdType === 'classico' 
                ? 'Exposição padrão. Comissão menor.' 
                : 'Maior visibilidade. Comissão maior.'}
        </p>
      </div>

      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="enjoeiInactivity" className="text-sm font-semibold text-gray-800">
          Meses sem Vendas (Inatividade)
        </Label>
        <div className="relative">
          <Input
            id="enjoeiInactivity"
            type="text"
            inputMode="numeric"
            className="pl-3 border-purple-200"
            value={enjoeiInactivityMonths}
            onChange={(e) => setEnjoeiInactivityMonths(e.target.value.replace(/\D/g, ''))}
            placeholder="0"
          />
        </div>
        <p className="text-xs text-gray-500">
            Cobrado R$ 11,00/mês se sem vendas por 2+ meses.
        </p>
      </div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="enjoeiShipping" className="text-sm font-semibold text-gray-800">
          Valor do Frete (R$)
        </Label>
        <div className="relative">
          <Input
            id="enjoeiShipping"
            type="text"
            inputMode="decimal"
            value={marketplaceShippingCost}
            onChange={(e) => handleCurrencyChange(e, setMarketplaceShippingCost)}
            placeholder="0,00"
          />
        </div>
      </div>
    </div>
  );
};
