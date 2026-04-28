import React, { useRef, useEffect, useMemo } from 'react';
import gsap from 'gsap';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Supplier, AccountHolder } from '../../services/referenceService';
import { SUPPLIER_ADDRESSES } from '../../services/pricingService';

interface ProductInfoProps {
  accountHolder: string;
  setAccountHolder: (value: string) => void;
  accountType: string;
  setAccountType: (value: 'cpf' | 'cnpj') => void;
  productName: string;
  setProductName: (value: string) => void;
  productImage: string;
  setProductImage: (value: string) => void;
  productDescription: string;
  setProductDescription: (value: string) => void;
  productSku: string;
  setProductSku: (value: string) => void;
  stockQuantity: string;
  setStockQuantity: (value: string) => void;
  weight: string;
  setWeight: (value: string) => void;
  width: string;
  setWidth: (value: string) => void;
  height: string;
  setHeight: (value: string) => void;
  depth: string;
  setDepth: (value: string) => void;
  operationMode: string;
  handleOperationModeChange: (value: string) => void;
  returnRate: string;
  setReturnRate: (value: string) => void;
  handleFloatInput: (setter: (value: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  deliveryMode: string;
  handleDeliveryModeChange: (value: string) => void;
  deliveryLogistics: string;
  setDeliveryLogistics: (value: string) => void;
  productCondition: string;
  setProductCondition: (value: string) => void;
  marketplace: string;
  supplierName: string;
  supplier_id: string;
  setSupplier_id: (value: string) => void;
  handleSupplierChange: (name: string, suppliersList?: Array<{ id: string; name: string }>) => void;
  suppliersList: Supplier[];
  accountHoldersList: AccountHolder[];
}

export const ProductInfo: React.FC<ProductInfoProps> = ({
  productName,
  setProductName,
  operationMode,
  handleOperationModeChange,
  returnRate,
  setReturnRate,
  handleFloatInput,
  deliveryMode,
  handleDeliveryModeChange,
  deliveryLogistics,
  setDeliveryLogistics,
  productCondition,
  setProductCondition,
  marketplace,
  productImage,
  setProductImage,
  productDescription,
  setProductDescription,
  productSku,
  setProductSku,
  stockQuantity,
  setStockQuantity,
  weight,
  setWeight,
  width,
  setWidth,
  height,
  setHeight,
  depth,
  setDepth,
  accountHolder,
  setAccountHolder,
  accountType,
  setAccountType,
  supplierName,
  supplier_id,
  setSupplier_id,
  handleSupplierChange,
  suppliersList,
  accountHoldersList
}) => {
  console.log('[ProductInfo] Render - accountHoldersList:', accountHoldersList, 'accountType:', accountType);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      // Se preferir sem animação, apenas mostrar os campos
      const fields = containerRef.current.querySelectorAll<HTMLElement>('.product-field');
      gsap.set(fields, { opacity: 1, y: 0, filter: 'blur(0px)' });
      return;
    }

    const fields = containerRef.current.querySelectorAll<HTMLElement>('.product-field');

    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo(fields,
      { opacity: 0, y: 28, filter: 'blur(6px)', scale: 0.97 },
      {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        scale: 1,
        duration: 0.55,
        stagger: 0.07,
      }
    );

    return () => { tl.kill(); };
  }, []);

  // Mostrar todos os titulares independente do tipo de conta selecionado
  const filteredHolders = accountHoldersList;

  console.log('[ProductInfo] Filtered holders:', filteredHolders);

  // Get supplier address for display (Task 3.5)
  const supplierAddress = useMemo(() => {
    if (!supplierName) return null;
    return SUPPLIER_ADDRESSES[supplierName] || null;
  }, [supplierName]);

  // Format address for display
  const formattedAddress = useMemo(() => {
    if (!supplierAddress) return '';
    const parts = [
      supplierAddress.street,
      supplierAddress.number,
      supplierAddress.complement,
      supplierAddress.neighborhood,
      supplierAddress.city,
      supplierAddress.state,
      `CEP: ${supplierAddress.postalCode}`
    ].filter(Boolean);
    return parts.join(', ');
  }, [supplierAddress]);

  return (
    <div ref={containerRef} className="contents">
      {/* Nome do Produto */}
      <div className="grid w-full max-w-sm items-center gap-1.5 product-field">
        <Label htmlFor="productName" className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Nome do Produto <span className="text-red-500">*</span>
        </Label>
        <Input
          id="productName"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="Ex: Fone Bluetooth"
        />
      </div>

      <div className="grid w-full max-w-sm items-center gap-1.5 product-field">
        <Label htmlFor="productSku" className="text-sm font-bold text-gray-900 dark:text-gray-100">
          SKU do Produto <span className="text-red-500">*</span>
        </Label>
        <Input
          id="productSku"
          value={productSku}
          onChange={(e) => setProductSku(e.target.value)}
          placeholder="Ex: SKU-001"
        />
      </div>

      {/* Fornecedor */}
      <div className="grid w-full max-w-sm items-center gap-1.5 product-field">
        <Label className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Fornecedor <span className="text-red-500">*</span>
        </Label>
        <Select 
          value={supplier_id || supplierName} 
          onValueChange={(value) => {
            setSupplier_id(value);
            const selectedSupplier = suppliersList.find(s => s.id === value);
            if (selectedSupplier) {
              handleSupplierChange(selectedSupplier.name, suppliersList);
            } else {
              // fallback: value pode ser o nome direto
              handleSupplierChange(value, suppliersList);
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o fornecedor" />
          </SelectTrigger>
          <SelectContent>
            {suppliersList.map((supplier) => (
              <SelectItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Display supplier address when selected (Task 3.5) */}
        {supplierAddress && formattedAddress && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Endereço do Fornecedor:
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {formattedAddress}
            </p>
            {marketplace === 'mercadolivre' && (
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                ℹ️ Este endereço será usado para calcular o frete grátis em produtos ≥ R$ 79,00
              </p>
            )}
          </div>
        )}
      </div>

      {/* Tipo de Conta */}
      <div className="grid w-full max-w-sm items-center gap-1.5 product-field">
        <Label className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Tipo de Conta
        </Label>
        <Select 
          value={accountType} 
          onValueChange={(value) => {
            setAccountType(value as 'cpf' | 'cnpj');
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="cpf">CPF</SelectItem>
            <SelectItem value="cnpj">CNPJ</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Titular */}
      <div className="grid w-full max-w-sm items-center gap-1.5 product-field">
        <Label className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Titular
        </Label>
        <Select 
          value={accountHolder} 
          onValueChange={setAccountHolder}
          disabled={!accountType}
        >
          <SelectTrigger>
            <SelectValue placeholder={
              !accountType ? "Selecione o tipo primeiro" :
              "Selecione o titular"
            } />
          </SelectTrigger>
          <SelectContent>
            {filteredHolders.map((holder) => (
              <SelectItem key={holder.id} value={holder.name}>
                {holder.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid w-full max-w-sm items-center gap-1.5 product-field">
        <Label htmlFor="stockQuantity" className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Quantidade em estoque
        </Label>
        <Input
          id="stockQuantity"
          type="number"
          inputMode="numeric"
          value={stockQuantity}
          onChange={(e) => setStockQuantity(e.target.value)}
          placeholder="0"
          min="0"
        />
      </div>

      <div className="grid w-full max-w-sm items-center gap-1.5 product-field">
        <Label className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Dimensões do Produto
          {marketplace === 'mercadolivre' && (
            <span className="text-red-500"> *</span>
          )}
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              id="productWeight"
              type="number"
              inputMode="decimal"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Peso (kg)"
              step="0.01"
              min="0"
              className="text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ex: 0.5</p>
          </div>
          <div>
            <Input
              id="productWidth"
              type="number"
              inputMode="decimal"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="Largura (cm)"
              step="1"
              min="1"
              className="text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ex: 15</p>
          </div>
          <div>
            <Input
              id="productHeight"
              type="number"
              inputMode="decimal"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="Altura (cm)"
              step="1"
              min="1"
              className="text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ex: 5</p>
          </div>
          <div>
            <Input
              id="productDepth"
              type="number"
              inputMode="decimal"
              value={depth}
              onChange={(e) => setDepth(e.target.value)}
              placeholder="Comprimento (cm)"
              step="1"
              min="1"
              className="text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ex: 20</p>
          </div>
        </div>
      </div>

      {/* Imagem do Produto */}
      <div className="grid w-full max-w-sm items-center gap-1.5 product-field">
        <Label htmlFor="productImage" className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Imagem do Produto (URL)
        </Label>
        <Input
          id="productImage"
          value={productImage}
          onChange={(e) => setProductImage(e.target.value)}
          placeholder="https://exemplo.com/imagem.jpg"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Se não informar, usamos a imagem padrão do marketplace
        </p>
      </div>

      <div className="grid w-full max-w-sm items-center gap-1.5 product-field">
        <Label htmlFor="productDescription" className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Descrição
        </Label>
        <Input
          id="productDescription"
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          placeholder="Digite a descrição do produto"
        />
      </div>

      {/* Modalidade */}
      <div className="grid w-full max-w-sm items-center gap-1.5 product-field">
        <Label className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Modalidade
        </Label>
        <Select value={operationMode} onValueChange={handleOperationModeChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a modalidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dropshipping">Dropshipping</SelectItem>
            <SelectItem value="armazem_alob">Estoque Próprio</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Chance de Devolução */}
      <div className="grid w-full max-w-sm items-center gap-1.5 product-field">
        <Label htmlFor="returnRate" className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Chance de devolução (%)
        </Label>
        <div className="relative">
          <Input
            id="returnRate"
            type="text"
            inputMode="decimal"
            value={returnRate}
            onChange={(e) => handleFloatInput(setReturnRate)(e)}
            className="pl-3"
            placeholder="33,33"
            step="0.01"
          />
        </div>
      </div>

      {/* Campos Condicionais da Modalidade */}
      {operationMode === 'armazem_alob' && (
        <>
          <div className="grid w-full max-w-sm items-center gap-1.5 product-field">
            <Label className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Estado do produto
            </Label>
            <Select value={productCondition} onValueChange={setProductCondition}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="defeito">Com defeito</SelectItem>
                <SelectItem value="usado">Usado</SelectItem>
                <SelectItem value="novo">Novo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid w-full max-w-sm items-center gap-1.5 product-field">
            <Label className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Modalidade de entrega
            </Label>
            <Select 
              value={deliveryMode} 
              onValueChange={handleDeliveryModeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a entrega" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrega_maos">Entrega em mãos</SelectItem>
                <SelectItem value="mais_envios">+Envios</SelectItem>
                <SelectItem value="correios">Correios</SelectItem>
                {marketplace === 'mercadolivre' && (
                  <SelectItem value="mercado_envios">Mercado Envios</SelectItem>
                )}
                {marketplace === 'shopee' && (
                  <SelectItem value="shopee_express">Shopee Express</SelectItem>
                )}
                {(marketplace === 'olx' || marketplace === 'enjoei') && (
                  <SelectItem value="jadlog">Jadlog</SelectItem>
                )}
                {marketplace === 'tiktok' && (
                  <SelectItem value="jet_express">JET Express</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          {(deliveryMode === 'correios' || deliveryMode === 'mais_envios') && (
            <div className="grid w-full max-w-sm items-center gap-1.5 product-field">
              <Label className="text-sm font-bold text-gray-900 dark:text-gray-100">
                Logística
              </Label>
              <Select value={deliveryLogistics} onValueChange={setDeliveryLogistics}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a logística" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pac">PAC</SelectItem>
                  <SelectItem value="sedex">Sedex</SelectItem>
                  <SelectItem value="jadlog">Jadlog</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}
    </div>
  );
};
