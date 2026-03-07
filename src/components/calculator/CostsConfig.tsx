import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from 'lucide-react';
import { handleCurrencyChange } from '../../utils/currency';

interface CostsConfigProps {
  packagingCost: string;
  setPackagingCost: (value: string) => void;
  gatewayFee: string;
  setGatewayFee: (value: string) => void;
  operationMode: string;
}

export const CostsConfig: React.FC<CostsConfigProps> = ({
  packagingCost,
  setPackagingCost,
  gatewayFee,
  setGatewayFee,
  operationMode
}) => {
  return (
    <>
      {/* Custos Extras */}
      {operationMode !== 'dropshipping' && (
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Label htmlFor="packagingCost" className="text-sm font-semibold text-gray-800">
            Custos embalagem + impressão + Transporte
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              id="packagingCost"
              type="text"
              inputMode="decimal"
              className="pl-8"
              value={packagingCost}
              onChange={(e) => handleCurrencyChange(e, setPackagingCost)}
              placeholder="0,00"
            />
          </div>
        </div>
      )}

      {/* Taxa de Gateway */}
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="gatewayFee" className="text-sm font-semibold text-gray-800">
          Taxa de Gateway de Pagamento (%)
        </Label>
        <div className="relative">
           <Input
            id="gatewayFee"
            type="text"
            inputMode="decimal"
            value={gatewayFee}
            onChange={(e) => handleCurrencyChange(e, setGatewayFee)}
            placeholder="Ex: 4,99"
           />
        </div>
      </div>
    </>
  );
};
