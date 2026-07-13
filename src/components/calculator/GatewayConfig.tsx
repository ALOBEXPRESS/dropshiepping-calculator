import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { handleCurrencyChange } from "../../utils/currency";
import pagbankIcon from '@/imgs/pagbank-logo.svg';

interface GatewayConfigProps {
  gatewayBank: string;
  handleGatewayBankChange: (value: string) => void;
  gatewayMethod: string;
  handleGatewayMethodChange: (value: string) => void;
  gatewayInstallments: string;
  handleGatewayInstallmentsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  gatewayFee: string;
  setGatewayFee: (value: string) => void;
  gatewayFeeType: 'percent' | 'fixed';
  setGatewayFeeType: (value: 'percent' | 'fixed') => void;
  gatewayFixedFee: string;
  idPrefix?: string;
  gatewayCost?: string;
}

export const GatewayConfig: React.FC<GatewayConfigProps> = ({
  gatewayBank,
  handleGatewayBankChange,
  gatewayMethod,
  handleGatewayMethodChange,
  gatewayInstallments,
  handleGatewayInstallmentsChange,
  gatewayFee,
  setGatewayFee,
  gatewayFeeType,
  setGatewayFeeType,
  idPrefix = 'gateway',
  gatewayCost
}) => {
  const bankLogoMap: Record<string, { src: string; alt: string }> = {
    mercadopago: { src: 'https://cdn.simpleicons.org/mercadopago/009EE3', alt: 'Mercado Pago' },
    nubank: { src: 'https://cdn.simpleicons.org/nubank/820AD1', alt: 'Nubank' },
    picpay: { src: 'https://cdn.simpleicons.org/picpay/11C76F', alt: 'PicPay' },
    paypal: { src: 'https://cdn.simpleicons.org/paypal/003087', alt: 'PayPal' },
    stripe: { src: 'https://cdn.simpleicons.org/stripe/635BFF', alt: 'Stripe' },
    bradesco: { src: 'https://commons.wikimedia.org/wiki/Special:FilePath/Banco_Bradesco_logo.svg', alt: 'Bradesco' },
    pagbank: { src: pagbankIcon, alt: 'PagBank', crop: true }
  };
  const bankButtons = [
    { key: 'mercadopago', label: 'Mercado Pago', active: 'bg-black hover:bg-black ring-2 ring-black ring-offset-2' },
    { key: 'nubank', label: 'Nubank', active: 'bg-black hover:bg-black ring-2 ring-black ring-offset-2' },
    { key: 'picpay', label: 'PicPay', active: 'bg-black hover:bg-black ring-2 ring-black ring-offset-2', testId: 'gateway-bank-picpay' },
    { key: 'paypal', label: 'PayPal', active: 'bg-black hover:bg-black ring-2 ring-black ring-offset-2' },
    { key: 'stripe', label: 'Stripe', active: 'bg-black hover:bg-black ring-2 ring-black ring-offset-2' },
    { key: 'bradesco', label: 'Bradesco', active: 'bg-black hover:bg-black ring-2 ring-black ring-offset-2' },
    { key: 'pagbank', label: 'PagBank', active: 'bg-white hover:bg-white ring-2 ring-[#dde05b] ring-offset-2' }
  ];
  const handleFeeTypeChange = (type: 'percent' | 'fixed') => {
    setGatewayFeeType(type);
    const currentValue = parseFloat(gatewayFee.replace(',', '.')) || 0;
    if (currentValue !== 0 || gatewayBank !== 'picpay') {
      return;
    }
    if (gatewayMethod === 'pix') {
      setGatewayFee('0');
      return;
    }
    if (type === 'fixed') {
      setGatewayFee('1,00');
      return;
    }
    setGatewayFee('0,99');
  };

  return (
    <>
      <div className="grid w-full max-w-sm gap-2 animate-fadeIn bg-gray-50 p-3 rounded-lg border border-gray-200 dark:bg-[#FF3366]">
         <Label className="text-sm font-semibold !text-gray-800 dark:!text-white">
           Configuração de Pagamento
         </Label>
         
         <div className="flex flex-wrap gap-2">
            {bankButtons.map((bank) => {
              const isActive = gatewayBank === bank.key;
              const logo = bankLogoMap[bank.key];
              const logoClassName = bank.key === 'bradesco' ? 'h-9 w-auto object-contain' : 'h-8 w-auto object-contain';
              return (
                <Button
                  key={bank.key}
                  variant={isActive ? "default" : "outline"}
                  className={`flex-1 h-12 text-xs text-white ${isActive ? bank.active : 'bg-white text-gray-700 hover:bg-gray-100'}`}
                  onClick={() => handleGatewayBankChange(bank.key)}
                  data-testid={bank.testId}
                  aria-label={bank.label}
                >
                  {bank.key === 'pagbank' ? (
                    <div className="overflow-hidden h-8 w-8 flex items-center justify-center">
                      <img src={logo.src} alt={logo.alt} style={{ height: '32px', width: 'auto', maxWidth: 'none', objectFit: 'none', objectPosition: 'left center' }} />
                    </div>
                  ) : (
                    <img src={logo.src} alt={logo.alt} className={logoClassName} />
                  )}
                  <span className="sr-only">{bank.label}</span>
                </Button>
              );
            })}
         </div>

         <div className="grid grid-cols-2 gap-2 mt-2">
            {gatewayBank === 'mercadopago' && (
               <>
                  <Button 
                     variant={gatewayMethod === 'pix' ? "secondary" : "ghost"}
                     className={`text-xs justify-start h-auto whitespace-normal break-words py-2 ${gatewayMethod === 'pix' ? 'bg-blue-100 text-blue-800 border border-blue-200' : ''}`}
                     onClick={() => handleGatewayMethodChange('pix')}
                  >
                     💠 PIX (0.49%)
                  </Button>
                  <Button 
                     variant={gatewayMethod === 'credit' ? "secondary" : "ghost"}
                     className={`text-xs justify-start h-auto whitespace-normal break-words py-2 ${gatewayMethod === 'credit' ? 'bg-blue-100 text-blue-800 border border-blue-200' : ''}`}
                     onClick={() => handleGatewayMethodChange('credit')}
                  >
                     💳 Crédito (4.99%)
                  </Button>
                  <Button 
                     variant={gatewayMethod === 'debit' ? "secondary" : "ghost"}
                     className={`text-xs justify-start h-auto whitespace-normal break-words py-2 ${gatewayMethod === 'debit' ? 'bg-blue-100 text-blue-800 border border-blue-200' : ''}`}
                     onClick={() => handleGatewayMethodChange('debit')}
                  >
                     💳 Débito (1.99%)
                  </Button>
               </>
            )}
            {gatewayBank === 'nubank' && (
               <>
                  <Button 
                     variant={gatewayMethod === 'pix' ? "secondary" : "ghost"}
                     className={`text-xs justify-start h-auto whitespace-normal break-words py-2 ${gatewayMethod === 'pix' ? 'bg-purple-100 text-purple-800 border border-purple-200' : ''}`}
                     onClick={() => handleGatewayMethodChange('pix')}
                  >
                     💠 PIX (0%)
                  </Button>
                   <Button 
                     variant={gatewayMethod === 'credit' ? "secondary" : "ghost"}
                     className={`text-xs justify-start h-auto whitespace-normal break-words py-2 ${gatewayMethod === 'credit' ? 'bg-purple-100 text-purple-800 border border-purple-200' : ''}`}
                     onClick={() => handleGatewayMethodChange('credit')}
                  >
                     Pix com crédito (3.99% a.m.)
                  </Button>
                  <Button 
                     variant={gatewayMethod === 'debit' ? "secondary" : "ghost"}
                     className={`text-xs justify-start h-auto whitespace-normal break-words py-2 ${gatewayMethod === 'debit' ? 'bg-purple-100 text-purple-800 border border-purple-200' : ''}`}
                     onClick={() => handleGatewayMethodChange('debit')}
                  >
                     💳 Débito (0.89%)
                  </Button>
                  
                  {gatewayMethod === 'credit' && (
                    <div className="col-span-2 text-[10px] text-gray-600 p-2 bg-purple-50 rounded border border-purple-100">
                        <p className="font-semibold mb-1">ℹ️ Juros mensais mínimos de 3,99% ao mês</p>
                        <p>Os juros aumentam conforme o número de parcelas.</p>
                    </div>
                  )}
               </>
            )}
            {gatewayBank === 'picpay' && (
               <>
                  <Button 
                     variant={gatewayMethod === 'pix' ? "secondary" : "ghost"}
                     className={`text-xs justify-start h-auto whitespace-normal break-words py-2 ${gatewayMethod === 'pix' ? 'bg-green-100 text-green-800 border border-green-200' : ''}`}
                     onClick={() => handleGatewayMethodChange('pix')}
                  >
                     💠 PIX (0%)
                  </Button>
                   <Button 
                     variant={gatewayMethod === 'credit' ? "secondary" : "ghost"}
                     className={`text-xs justify-start h-auto whitespace-normal break-words py-2 ${gatewayMethod === 'credit' ? 'bg-green-100 text-green-800 border border-green-200' : ''}`}
                     onClick={() => handleGatewayMethodChange('credit')}
                     data-testid="gateway-method-pix-credit"
                  >
                     Pix com crédito (4,29% a 20,86%)
                  </Button>

                  {gatewayMethod === 'credit' && (
                    <div className="col-span-2 text-[10px] text-gray-600 p-2 bg-green-50 rounded border border-green-100 space-y-2">
                        <div>
                            <p className="font-semibold">ℹ️ Taxa por parcelas (PicPay)</p>
                            <ul className="list-disc pl-3 mt-1 space-y-1">
                                <li>1x: 4,29% | 2x: 6,78% | 3x: 8,28%</li>
                                <li>4x: 9,78% | 5x: 13,86% | 6x: 14,86%</li>
                                <li>7x: 15,86% | 8x: 16,86% | 9x: 17,86%</li>
                                <li>10x: 18,86% | 11x: 19,86% | 12x: 20,86%</li>
                            </ul>
                        </div>
                    </div>
                  )}
               </>
            )}
            {gatewayBank === 'paypal' && (
                <>
                    <div className="col-span-2 text-xs text-gray-600 p-2 bg-blue-50 rounded">
                        Taxa Padrão: 4.79% + R$ 0.60 (Fixo)
                    </div>
                </>
            )}
            {gatewayBank === 'stripe' && (
                <div className="col-span-2 text-xs text-gray-600 p-2 bg-indigo-50 rounded">
                    Taxa Padrão: 3.99% + R$ 0.39 (Fixo)
                </div>
            )}
            {gatewayBank === 'bradesco' && (
               <>
                  <Button 
                     variant={gatewayMethod === 'debit' ? "secondary" : "ghost"}
                     className={`text-xs justify-start h-auto whitespace-normal break-words py-2 ${gatewayMethod === 'debit' ? 'bg-red-100 text-red-800 border border-red-200' : ''}`}
                     onClick={() => handleGatewayMethodChange('debit')}
                  >
                     💳 Débito (1.99%)
                  </Button>
                  <Button 
                     variant={gatewayMethod === 'credit' ? "secondary" : "ghost"}
                     className={`text-xs justify-start h-auto whitespace-normal break-words py-2 ${gatewayMethod === 'credit' ? 'bg-red-100 text-red-800 border border-red-200' : ''}`}
                     onClick={() => handleGatewayMethodChange('credit')}
                  >
                     Cartão de Crédito
                  </Button>
               </>
            )}
            {gatewayBank === 'pagbank' && (
               <>
                  <Button
                     variant={gatewayMethod === 'pix' ? "secondary" : "ghost"}
                     className={`text-xs justify-start h-auto whitespace-normal break-words py-2 ${gatewayMethod === 'pix' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : ''}`}
                     onClick={() => handleGatewayMethodChange('pix')}
                  >
                     💠 PIX (0%)
                  </Button>
                  <Button
                     variant={gatewayMethod === 'credit' ? "secondary" : "ghost"}
                     className={`text-xs justify-start h-auto whitespace-normal break-words py-2 ${gatewayMethod === 'credit' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : ''}`}
                     onClick={() => handleGatewayMethodChange('credit')}
                  >
                     Crédito (3.99% a 21.58%)
                  </Button>
                  <Button
                     variant={gatewayMethod === 'debit' ? "secondary" : "ghost"}
                     className={`text-xs justify-start h-auto whitespace-normal break-words py-2 ${gatewayMethod === 'debit' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' : ''}`}
                     onClick={() => handleGatewayMethodChange('debit')}
                  >
                     💳 Débito (1.99%)
                  </Button>
                  {gatewayMethod === 'credit' && (
                    <div className="col-span-2 text-[10px] text-gray-600 p-2 bg-yellow-50 rounded border border-yellow-100 space-y-1">
                        <p className="font-semibold">ℹ️ Taxa por parcelas (PagBank)</p>
                        <ul className="list-disc pl-3 space-y-0.5">
                            <li>1x: 3,99% | 2x: 6,58% | 3x: 8,08%</li>
                            <li>4x: 9,58% | 5x: 11,08% | 6x: 12,58%</li>
                            <li>7x: 14,08% | 8x: 15,58% | 9x: 17,08%</li>
                            <li>10x: 18,58% | 11x: 20,08% | 12x: 21,58%</li>
                        </ul>
                    </div>
                  )}
               </>
            )}
            {/* Installments for Nubank, Bradesco, PicPay, PagBank AND PayPal */}
            {((gatewayMethod === 'credit' && ['nubank', 'bradesco', 'picpay', 'pagbank'].includes(gatewayBank)) || gatewayBank === 'paypal') && (
              <div className="mt-2 animate-fadeIn col-span-2">
                <Label className="text-xs">Parcelas (1-12)</Label>
                <Input 
                  type="number" 
                  min="1" 
                  max="12" 
                  value={gatewayInstallments}
                  onChange={handleGatewayInstallmentsChange}
                  className="h-8 mt-1"
                />
                <p className="text-[10px] text-gray-500">
                    {gatewayBank === 'paypal' ? 'Taxa aumenta aprox. 1.92% por parcela' : 'Taxa aumenta com parcelas'}
                </p>
              </div>
            )}
         </div>

      </div>

      <div className="grid w-full max-w-sm items-center gap-1.5 mt-2">
         <div className="flex justify-between items-center">
             <Label htmlFor={`${idPrefix}Fee`} className="text-sm font-semibold text-gray-800 dark:text-white">
             Taxa de Gateway
             </Label>
             <div className="flex items-center space-x-2">
                 <Button
                     size="sm"
                     variant={gatewayFeeType === 'percent' ? 'default' : 'outline'}
                     onClick={() => handleFeeTypeChange('percent')}
                     className={`h-6 text-xs ${gatewayFeeType === 'percent' ? 'bg-blue-600' : ''}`}
                 >
                     %
                 </Button>
                 <Button
                     size="sm"
                     variant={gatewayFeeType === 'fixed' ? 'default' : 'outline'}
                     onClick={() => handleFeeTypeChange('fixed')}
                     className={`h-6 text-xs ${gatewayFeeType === 'fixed' ? 'bg-blue-600' : ''}`}
                 >
                     R$
                 </Button>
             </div>
         </div>
         <div className="flex gap-2">
            <div className="relative flex-1">
               <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                  {gatewayFeeType === 'percent' ? '%' : 'R$'}
               </span>
               <Input
                  id={`${idPrefix}Fee`}
                  type="text"
                  inputMode="decimal"
                  value={gatewayFee}
                  onChange={(e) => handleCurrencyChange(e, setGatewayFee)}
                  className={`pl-8 ${gatewayFeeType === 'percent' ? 'border-green-400 focus:border-green-600' : 'border-blue-400 focus:border-blue-600'} font-bold`}
                  placeholder="0,00"
               />
            </div>
            {gatewayCost && (
               <div className="flex items-center justify-center bg-gray-100 rounded px-3 py-2 border border-gray-200 min-w-[80px]">
                  <span className="text-xs font-bold text-gray-700">R$ {gatewayCost}</span>
               </div>
            )}
         </div>
      </div>
    </>
  );
};
