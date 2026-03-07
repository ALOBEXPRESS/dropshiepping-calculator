import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Supplier, AccountHolder } from '../../services/referenceService';

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
  handleSupplierChange: (name: string) => void;
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
  
  // Tipos de conta fixos (sempre CPF e CNPJ)
  const accountTypes = ['CPF', 'CNPJ'];
  
  // Mostrar todos os titulares independente do tipo de conta selecionado
  const filteredHolders = accountHoldersList;

  console.log('[ProductInfo] Filtered holders:', filteredHolders);

  return (
    <>
      {/* Nome do Produto */}
      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
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

      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
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
      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
        <Label className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Fornecedor <span className="text-red-500">*</span>
        </Label>
        <Select 
          value={supplier_id || supplierName} 
          onValueChange={(value) => {
            setSupplier_id(value);
            const selectedSupplier = suppliersList.find(s => s.id === value);
            if (selectedSupplier) {
              handleSupplierChange(selectedSupplier.name);
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
      </div>

      {/* Tipo de Conta */}
      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
        <Label className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Tipo de Conta
        </Label>
        <Select 
          value={accountType} 
          onValueChange={(value) => {
            setAccountType(value as 'cpf' | 'cnpj');
            // Limpar titular quando mudar o tipo
            setAccountHolder('');
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
      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
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

      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
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

      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
        <Label className="text-sm font-bold text-gray-900 dark:text-gray-100">
          Dimensões (kg/g/cm/m)
        </Label>
        <div className="grid grid-cols-2 gap-2">
          <Input
            id="productWeight"
            type="text"
            inputMode="decimal"
            value={weight}
            onChange={(e) => handleFloatInput(setWeight)(e)}
            placeholder="Peso (kg)"
          />
          <Input
            id="productWidth"
            type="text"
            inputMode="decimal"
            value={width}
            onChange={(e) => handleFloatInput(setWidth)(e)}
            placeholder="Largura (cm)"
          />
          <Input
            id="productHeight"
            type="text"
            inputMode="decimal"
            value={height}
            onChange={(e) => handleFloatInput(setHeight)(e)}
            placeholder="Altura (cm)"
          />
          <Input
            id="productDepth"
            type="text"
            inputMode="decimal"
            value={depth}
            onChange={(e) => handleFloatInput(setDepth)(e)}
            placeholder="Profundidade (cm)"
          />
        </div>
      </div>

      {/* Imagem do Produto */}
      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
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

      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
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
      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
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
      <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
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
          <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
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
          <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
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
            <div className="grid w-full max-w-sm items-center gap-1.5 animate-fadeIn">
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
    </>
  );
};
