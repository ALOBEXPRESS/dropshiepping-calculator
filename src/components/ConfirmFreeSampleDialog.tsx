import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Loader2, Gift, User } from 'lucide-react';
import type { PendingOrder } from '@/types/pendingOrder';
import type { InfluencerOption } from '@/hooks/useFreeSampleLane';

interface ConfirmFreeSampleDialogProps {
  open: boolean;
  order: PendingOrder | null;
  influencers: InfluencerOption[];
  influencersLoading: boolean;
  isProcessing: boolean;
  onConfirm: (influencerId: string | null) => void;
  onCancel: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);

export const ConfirmFreeSampleDialog: React.FC<ConfirmFreeSampleDialogProps> = ({
  open,
  order,
  influencers,
  influencersLoading,
  isProcessing,
  onConfirm,
  onCancel,
}) => {
  const [selectedInfluencerId, setSelectedInfluencerId] = useState<string>('');

  const handleConfirm = () => {
    onConfirm(selectedInfluencerId === '__none__' || selectedInfluencerId === '' ? null : selectedInfluencerId);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && !isProcessing) {
      setSelectedInfluencerId('');
      onCancel();
    }
  };

  if (!order) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-violet-500" />
            Enviar Amostra Grátis
          </DialogTitle>
          <DialogDescription>
            Este pedido será processado com lucro zero como amostra grátis para influenciador.
          </DialogDescription>
        </DialogHeader>

        {/* Order summary */}
        <div className="rounded-lg bg-muted/50 p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pedido</span>
            <span className="font-medium">#{order.order_number}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cliente</span>
            <span className="font-medium truncate max-w-[180px]">{order.customer_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Marketplace</span>
            <span className="font-medium">{order.marketplace_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Valor</span>
            <span className="font-medium">{formatCurrency(order.total_amount)}</span>
          </div>
          {order.first_product_name && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Produto</span>
              <span className="font-medium truncate max-w-[180px]">{order.first_product_name}</span>
            </div>
          )}
        </div>

        <Separator />

        {/* Influencer selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <User className="w-4 h-4 text-muted-foreground" />
            Associar a um influenciador
            <span className="text-muted-foreground font-normal">(opcional)</span>
          </label>
          <Select
            value={selectedInfluencerId}
            onValueChange={setSelectedInfluencerId}
            disabled={influencersLoading || isProcessing}
          >
            <SelectTrigger>
              <SelectValue placeholder={influencersLoading ? 'Carregando...' : 'Sem influenciador'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sem influenciador</SelectItem>
              {influencers.map((inf) => (
                <SelectItem key={inf.id} value={inf.id}>
                  <span className="font-medium">{inf.name}</span>
                  {inf.instagram && (
                    <span className="text-muted-foreground ml-1 text-xs">@{inf.instagram}</span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isProcessing}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isProcessing}
            className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Gift className="w-4 h-4 mr-2" />
                Confirmar Amostra Grátis
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
