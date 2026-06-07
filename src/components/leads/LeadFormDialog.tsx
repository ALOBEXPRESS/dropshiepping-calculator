/**
 * LeadFormDialog Component
 * 
 * Modal dialog for creating and editing leads.
 * Uses react-hook-form for form state management and Zod for validation.
 * 
 * Features:
 * - Create new lead
 * - Edit existing lead
 * - Form validation (name required, email format, phone format, document format)
 * - Loading states during submission
 * - Success/error messages
 * - Keyboard shortcuts (Escape to close, Enter to submit)
 * 
 * Requirements: 6.1-6.9, 7.1-7.8
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useCreateLead, useUpdateLead, useLeadMarketplaces } from '@/hooks/useLeads';
import type { Lead, LeadFormData } from '@/types/leads';
import { Loader2 } from 'lucide-react';
import { LEAD_STATUS_OPTIONS } from './constants';
import { getErrorMessage } from '@/utils/errorMessages';

/**
 * Validation schema for lead form
 * 
 * Rules:
 * - name: Required, min 2 characters
 * - email: Valid email format if provided
 * - phone: Valid Brazilian phone format if provided (optional)
 * - document_number: Valid CPF/CNPJ format if provided (optional)
 */
const leadFormSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  
  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  
  phone: z.string()
    .regex(/^(\(\d{2}\)\s?)?\d{4,5}-?\d{4}$|^\d{10,11}$/, 'Telefone inválido (formato: (11) 99999-9999)')
    .optional()
    .or(z.literal('')),
  
  mobile_phone: z.string()
    .regex(/^(\(\d{2}\)\s?)?\d{4,5}-?\d{4}$|^\d{10,11}$/, 'Celular inválido (formato: (11) 99999-9999)')
    .optional()
    .or(z.literal('')),
  
  document_type: z.enum(['cpf', 'cnpj'] as const)
    .optional(),
  
  document_number: z.string()
    .refine(
      (val) => {
        if (!val) return true;
        // Remove non-digits
        const digits = val.replace(/\D/g, '');
        // CPF: 11 digits, CNPJ: 14 digits
        return digits.length === 11 || digits.length === 14;
      },
      'CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos'
    )
    .optional()
    .or(z.literal('')),
  
  company_name: z.string()
    .max(100, 'Nome da empresa deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  trade_name: z.string()
    .max(100, 'Nome fantasia deve ter no máximo 100 caracteres')
    .optional()
    .or(z.literal('')),
  
  marketplace_id: z.string()
    .optional(),
  
  lead_status: z.enum(['new', 'contacted', 'qualified', 'lost', 'converted', 'recurrent'] as const)
    .optional(),
  
  lead_source: z.string()
    .max(50, 'Origem deve ter no máximo 50 caracteres')
    .optional()
    .or(z.literal('')),
});

type LeadFormValues = z.infer<typeof leadFormSchema>;

interface LeadFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead?: Lead | null;
  organizationId: string;
  onSuccess?: () => void;
}

/**
 * LeadFormDialog - Modal form for creating/editing leads
 * 
 * Modes:
 * - Create: lead prop is null/undefined
 * - Edit: lead prop contains existing lead data
 * 
 * Validation:
 * - Client-side validation using Zod schema
 * - Real-time validation on blur
 * - Form-level validation on submit
 * 
 * Submission:
 * - Uses useCreateLead or useUpdateLead mutation hooks
 * - Shows loading state during submission
 * - Displays success toast on completion
 * - Displays error toast on failure
 * - Closes dialog on success
 */
export function LeadFormDialog({
  open,
  onOpenChange,
  lead,
  organizationId,
  onSuccess,
}: LeadFormDialogProps) {
  const { toast } = useToast();
  const isEditMode = !!lead;
  
  // Fetch marketplaces for dropdown
  const { data: marketplaces, isLoading: isLoadingMarketplaces } = useLeadMarketplaces(organizationId);
  
  // Mutation hooks
  const createMutation = useCreateLead(organizationId);
  const updateMutation = useUpdateLead(organizationId);
  
  // Form setup
  const form = useForm<LeadFormValues>({
    resolver: zodResolver(leadFormSchema),
    mode: 'onBlur', // Validate on blur
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      mobile_phone: '',
      document_type: undefined,
      document_number: '',
      company_name: '',
      trade_name: '',
      marketplace_id: undefined,
      lead_status: 'new',
      lead_source: '',
    },
  });
  
  // Reset form when lead changes or dialog opens
  useEffect(() => {
    if (open) {
      if (lead) {
        // Edit mode - populate form with lead data
        form.reset({
          name: lead.name,
          email: lead.email || '',
          phone: lead.phone || '',
          mobile_phone: lead.mobile_phone || '',
          document_type: lead.document_type
            ? (lead.document_type.toLowerCase() as 'cpf' | 'cnpj')
            : undefined,
          document_number: lead.document_number || '',
          company_name: lead.company_name || '',
          trade_name: lead.trade_name || '',
          marketplace_id: lead.marketplace_id || undefined,
          lead_status: lead.lead_status || 'new',
          lead_source: lead.lead_source || '',
        });
      } else {
        // Create mode - reset to defaults
        form.reset({
          name: '',
          email: '',
          phone: '',
          mobile_phone: '',
          document_type: undefined,
          document_number: '',
          company_name: '',
          trade_name: '',
          marketplace_id: undefined,
          lead_status: 'new',
          lead_source: '',
        });
      }
    }
  }, [open, lead]); // eslint-disable-line react-hooks/exhaustive-deps
  
  /**
   * Handle form submission
   * 
   * Requirements: 6.7, 6.8, 6.9, 7.5, 7.6, 7.7
   */
  const onSubmit = async (values: LeadFormValues) => {
    try {
      // Convert empty strings to undefined for optional fields
      const formData: LeadFormData = {
        name: values.name,
        email: values.email || undefined,
        phone: values.phone || undefined,
        mobile_phone: values.mobile_phone || undefined,
        document_type: values.document_type,
        document_number: values.document_number || undefined,
        company_name: values.company_name || undefined,
        trade_name: values.trade_name || undefined,
        marketplace_id: values.marketplace_id,
        lead_status: values.lead_status,
        lead_source: values.lead_source || undefined,
      };
      
      if (isEditMode) {
        // Update existing lead
        await updateMutation.mutateAsync({
          leadId: lead.id,
          formData,
        });
        
        toast({
          title: 'Lead atualizado',
          description: 'As informações do lead foram atualizadas com sucesso.',
        });
      } else {
        // Create new lead
        await createMutation.mutateAsync(formData);
        
        toast({
          title: 'Lead criado',
          description: 'O novo lead foi criado com sucesso.',
        });
      }
      
      // Close dialog and call success callback
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      // Get user-friendly error message (Requirements: 6.9, 7.7)
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? 'update' : 'create'
      );
      
      // Error toast
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    }
  };
  
  /**
   * Handle dialog close
   */
  const handleClose = () => {
    if (!createMutation.isPending && !updateMutation.isPending) {
      onOpenChange(false);
    }
  };
  
  /**
   * Handle cancel button
   */
  const handleCancel = () => {
    handleClose();
  };
  
  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto"
        aria-describedby="lead-form-description"
      >
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? 'Editar Lead' : 'Adicionar Lead'}
          </DialogTitle>
          <DialogDescription id="lead-form-description">
            {isEditMode
              ? 'Atualize as informações do lead abaixo.'
              : 'Preencha as informações do novo lead abaixo.'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" aria-label={isEditMode ? 'Formulário de edição de lead' : 'Formulário de criação de lead'}>
            {/* Name - Required */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nome <span className="text-red-500" aria-label="obrigatório">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome completo"
                      {...field}
                      disabled={isSubmitting}
                      aria-required="true"
                      aria-invalid={!!form.formState.errors.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="email@exemplo.com"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Phone and Mobile Phone - Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(11) 3333-4444"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mobile_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Celular</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(11) 99999-8888"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Document Type and Number - Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="document_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Documento</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="cpf">CPF</SelectItem>
                        <SelectItem value="cnpj">CNPJ</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="document_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número do Documento</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Company Name and Trade Name - Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Razão Social</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome da empresa"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="trade_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Fantasia</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Nome fantasia"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Marketplace and Status - Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="marketplace_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canal</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting || isLoadingMarketplaces}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um canal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {marketplaces?.map((marketplace) => (
                          <SelectItem key={marketplace.id} value={marketplace.id}>
                            {marketplace.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="lead_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEAD_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {/* Lead Source */}
            <FormField
              control={form.control}
              name="lead_source"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origem do Lead</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Indicação, Google Ads, Redes Sociais"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Como este lead chegou até você?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditMode ? 'Salvar Alterações' : 'Criar Lead'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
