
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";

export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  stock_quantity: number;
  sku: string;
  is_digital: boolean;
}

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product;
  onSave: () => void;
}

export function ProductDialog({
  isOpen,
  onClose,
  product,
  onSave,
}: ProductDialogProps) {
  const [formData, setFormData] = useState<Product>({
    name: "",
    description: "",
    price: 0,
    stock_quantity: 0,
    sku: "",
    is_digital: false,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData(product);
    } else {
      setFormData({
        name: "",
        description: "",
        price: 0,
        stock_quantity: 0,
        sku: "",
        is_digital: false,
      });
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (product?.id) {
        const { error } = await supabase
          .from("products")
          .update(formData)
          .eq("id", product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert([formData]);
        if (error) throw error;
      }
      onSave();
      onClose();
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Erro ao salvar produto");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {product?.id ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nome
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descrição
            </Label>
            <Input
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="sku" className="text-right">
              SKU
            </Label>
            <Input
              id="sku"
              value={formData.sku || ""}
              onChange={(e) =>
                setFormData({ ...formData, sku: e.target.value })
              }
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="price" className="text-right">
              Preço
            </Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: parseFloat(e.target.value) })
              }
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock" className="text-right">
              Estoque
            </Label>
            <Input
              id="stock"
              type="number"
              value={formData.stock_quantity}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  stock_quantity: parseInt(e.target.value),
                })
              }
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="digital" className="text-right">
              Digital
            </Label>
            <Checkbox
              id="digital"
              checked={formData.is_digital}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_digital: checked as boolean })
              }
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
