/**
 * DeleteConfirmDialog Component
 * 
 * Confirmation dialog for deleting leads.
 * Displays lead name and warning message before deletion.
 * 
 * Features:
 * - Displays lead name in confirmation message
 * - Shows warning that action cannot be undone
 * - Cancel and Confirm buttons
 * - Loading state during deletion
 * - Success/error toast notifications
 * - Keyboard shortcuts (Escape to close)
 * 
 * Requirements: 8.1-8.7
 */

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDeleteLead } from '@/hooks/useLeads';
import { Loader2, AlertTriangle } from 'lucide-react';
import { getErrorMessage } from '@/utils/errorMessages';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  organizationId: string;
  onSuccess?: () => void;
}

/**
 * DeleteConfirmDialog - Confirmation dialog for lead deletion
 * 
 * Flow:
 * 1. User clicks delete button in table
 * 2. Dialog opens with lead name and warning
 * 3. User can cancel or confirm
 * 4. On confirm, useDeleteLead mutation is triggered
 * 5. Loading state shown during deletion
 * 6. Success toast displayed on completion
 * 7. Error toast displayed on failure
 * 8. Dialog closes on success or cancel
 * 
 * Security:
 * - Requires explicit confirmation before deletion
 * - Shows clear warning that action cannot be undone
 * - Uses organization_id for RLS security check
 */
export function DeleteConfirmDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  organizationId,
  onSuccess,
}: DeleteConfirmDialogProps) {
  const { toast } = useToast();
  const deleteMutation = useDeleteLead(organizationId);

  /**
   * Handle delete confirmation
   * 
   * Requirements: 8.4, 8.5, 8.6, 8.7
   */
  const handleConfirm = async () => {
    try {
      await deleteMutation.mutateAsync(leadId);

      toast({
        title: 'Lead deletado',
        description: `${leadName} foi removido com sucesso.`,
      });

      // Close dialog and call success callback
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Get user-friendly error message (Requirement: 8.6)
      const errorMessage = getErrorMessage(error, 'delete');
      
      // Error toast
      toast({
        title: 'Erro ao deletar lead',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };

  /**
   * Handle cancel button
   */
  const handleCancel = () => {
    if (!deleteMutation.isPending) {
      onOpenChange(false);
    }
  };

  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!deleteMutation.isPending) {
      onOpenChange(false);
    }
  };

  const isDeleting = deleteMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[500px]"
        aria-describedby="delete-confirm-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription id="delete-confirm-description">
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10" role="alert" aria-live="polite">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            Você está prestes a deletar o lead <strong>{leadName}</strong>.
            Todos os dados associados a este lead serão permanentemente removidos.
          </AlertDescription>
        </Alert>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isDeleting}
            aria-label="Cancelar exclusão"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            aria-label={`Confirmar exclusão de ${leadName}`}
          >
            {isDeleting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            Deletar Lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
