import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from 'lucide-react';
import type { Variation } from '../../types/calculator';

interface VariationsManagerProps {
  hasVariations: boolean;
  setHasVariations: (checked: boolean) => void;
  variationName: string;
  setVariationName: (value: string) => void;
  variationSku: string;
  setVariationSku: (value: string) => void;
  variationCost: string;
  setVariationCost: (value: string) => void;
  variationMarkup: string;
  setVariationMarkup: (value: string) => void;
  variations: Variation[];
  addVariation: () => void;
  removeVariation: (id: string) => void;
}

export const VariationsManager: React.FC<VariationsManagerProps> = ({
  hasVariations,
  setHasVariations,
  variationName,
  setVariationName,
  variationSku,
  setVariationSku,
  variationCost,
  setVariationCost,
  variationMarkup,
  setVariationMarkup,
  variations,
  addVariation,
  removeVariation
}) => {
  return (
    <>
      <div className="flex items-center space-x-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
        <Checkbox 
          id="hasVariations" 
          checked={hasVariations}
          onCheckedChange={(checked) => setHasVariations(checked as boolean)}
        />
        <Label htmlFor="hasVariations" className="font-bold text-gray-800 cursor-pointer">
          É produto com variação?
        </Label>
      </div>

      {hasVariations && (
        <div className="space-y-3 animate-fadeIn">
          <div className="grid grid-cols-4 gap-2">
            <Input 
              placeholder="Variação (ex: P)" 
              value={variationName}
              onChange={(e) => setVariationName(e.target.value)}
              className="text-xs"
            />
            <Input 
              placeholder="SKU Variação" 
              value={variationSku}
              onChange={(e) => setVariationSku(e.target.value)}
              className="text-xs"
            />
            <Input 
              type="number" 
              placeholder="Custo (R$)" 
              value={variationCost}
              onChange={(e) => setVariationCost(e.target.value)}
              className="text-xs"
            />
            <Input 
              type="number" 
              placeholder="Markup" 
              value={variationMarkup}
              onChange={(e) => setVariationMarkup(e.target.value)}
              className="text-xs"
            />
          </div>
          <Button onClick={addVariation} size="sm" className="w-full bg-[#d91c42] hover:bg-[#b91536]">
            <Plus className="w-4 h-4 mr-2" /> Adicionar Variação
          </Button>

          {variations.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="h-8 text-xs">Variação</TableHead>
                    <TableHead className="h-8 text-xs">SKU</TableHead>
                    <TableHead className="h-8 text-xs">Custo</TableHead>
                    <TableHead className="h-8 text-xs">Markup</TableHead>
                    <TableHead className="h-8 text-xs w-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {variations.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="py-2 text-xs font-medium">{v.name}</TableCell>
                      <TableCell className="py-2 text-xs">{v.sku || '-'}</TableCell>
                      <TableCell className="py-2 text-xs">R$ {v.cost}</TableCell>
                      <TableCell className="py-2 text-xs">{v.markup}</TableCell>
                      <TableCell className="py-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 text-red-500 hover:text-red-700"
                          onClick={() => removeVariation(v.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </>
  );
};
