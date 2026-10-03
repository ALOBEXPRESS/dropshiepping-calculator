import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  TestadorSchema,
  TitularSchema,
  InfluenciadorSchema,
  type TestadorFormData,
  type TitularFormData,
  type InfluenciadorFormData,
  type Testador,
  type Titular,
  type Influenciador,
  type ResponsavelTab,
} from '@/types/responsaveis';
import { User, Users, Megaphone, Instagram, Percent } from 'lucide-react';

// ── Config ──────────────────────────────────────────────────────────────────

const TAB_CONFIG = {
  testadores: { label: 'Testador', icon: User },
  titulares: { label: 'Titular', icon: Users },
  influenciadores: { label: 'Influenciador', icon: Megaphone },
} as const;

// ── Testador Form ────────────────────────────────────────────────────────────

interface TestadorFormProps {
  defaultValues?: Partial<TestadorFormData>;
  onSubmit: (data: TestadorFormData) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
}

function TestadorForm({ defaultValues, onSubmit, onCancel, isEditing }: TestadorFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<TestadorFormData>({
    resolver: zodResolver(TestadorSchema),
    defaultValues: { document_type: 'cpf', is_active: true, ...defaultValues },
  });

  const docType = watch('document_type');
  const isActive = watch('is_active');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="td_full_name">Nome completo <span className="text-red-400">*</span></Label>
        <Input id="td_full_name" placeholder="Ex: João da Silva" {...register('full_name')}
          className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        {errors.full_name && <p className="text-xs text-red-400">{errors.full_name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tipo de documento</Label>
          <Select value={docType} onValueChange={(v) => setValue('document_type', v as TestadorFormData['document_type'])}>
            <SelectTrigger className="bg-[hsl(var(--card))] border-[hsl(var(--border))]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cpf">CPF</SelectItem>
              <SelectItem value="cnpj">CNPJ</SelectItem>
              <SelectItem value="rg">RG</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="td_doc">Número</Label>
          <Input id="td_doc" placeholder={docType === 'cpf' ? '000.000.000-00' : ''} {...register('document_number')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="td_rg">RG</Label>
          <Input id="td_rg" placeholder="Número do RG" {...register('rg')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="td_birth">Data de nascimento</Label>
          <Input id="td_birth" type="date" {...register('birth_date')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="td_phone">Telefone</Label>
          <Input id="td_phone" placeholder="(00) 00000-0000" {...register('phone')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="td_email">E-mail</Label>
          <Input id="td_email" type="email" placeholder="email@exemplo.com" {...register('email')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="td_notes">Observações</Label>
        <Textarea id="td_notes" rows={2} placeholder="Informações adicionais..." {...register('notes')}
          className="bg-[hsl(var(--card))] border-[hsl(var(--border))] resize-none" />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Switch id="td_active" checked={isActive ?? true} onCheckedChange={(v: boolean) => setValue('is_active', v)} />
        <Label htmlFor="td_active" className="cursor-pointer">Testador ativo</Label>
      </div>

      <DialogFooter className="pt-2 border-t border-[hsl(var(--border))]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand)/0.9)] text-white">
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar Testador'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Titular Form ─────────────────────────────────────────────────────────────

interface TitularFormProps {
  defaultValues?: Partial<TitularFormData>;
  onSubmit: (data: TitularFormData) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
}

function TitularForm({ defaultValues, onSubmit, onCancel, isEditing }: TitularFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<TitularFormData>({
    resolver: zodResolver(TitularSchema),
    defaultValues: { document_type: 'cpf', ...defaultValues },
  });

  const docType = watch('document_type');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="tit_full_name">Nome completo <span className="text-red-400">*</span></Label>
        <Input id="tit_full_name" placeholder="Ex: Maria da Silva" {...register('full_name')}
          className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        {errors.full_name && <p className="text-xs text-red-400">{errors.full_name.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Tipo de documento</Label>
          <Select value={docType} onValueChange={(v) => setValue('document_type', v as TitularFormData['document_type'])}>
            <SelectTrigger className="bg-[hsl(var(--card))] border-[hsl(var(--border))]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="cpf">CPF</SelectItem>
              <SelectItem value="cnpj">CNPJ</SelectItem>
              <SelectItem value="rg">RG</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tit_doc">Número</Label>
          <Input id="tit_doc" placeholder={docType === 'cpf' ? '000.000.000-00' : ''} {...register('document_number')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="tit_rg">RG</Label>
          <Input id="tit_rg" placeholder="Número do RG" {...register('rg')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tit_birth">Data de nascimento</Label>
          <Input id="tit_birth" type="date" {...register('birth_date')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="tit_phone">Telefone</Label>
          <Input id="tit_phone" placeholder="(00) 00000-0000" {...register('phone')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tit_email">E-mail</Label>
          <Input id="tit_email" type="email" placeholder="email@exemplo.com" {...register('email')}
            className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="tit_notes">Observações</Label>
        <Textarea id="tit_notes" rows={2} placeholder="Informações adicionais..." {...register('notes')}
          className="bg-[hsl(var(--card))] border-[hsl(var(--border))] resize-none" />
      </div>

      <DialogFooter className="pt-2 border-t border-[hsl(var(--border))]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand)/0.9)] text-white">
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar Titular'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Influenciador Form ───────────────────────────────────────────────────────

interface InfluenciadorFormProps {
  defaultValues?: Partial<InfluenciadorFormData>;
  onSubmit: (data: InfluenciadorFormData) => Promise<void>;
  onCancel: () => void;
  isEditing: boolean;
}

function InfluenciadorForm({ defaultValues, onSubmit, onCancel, isEditing }: InfluenciadorFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<InfluenciadorFormData>({
    resolver: zodResolver(InfluenciadorSchema),
    defaultValues: { percentage: 0, is_active: true, ...defaultValues },
  });

  const isActive = watch('is_active');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="inf_name">Nome / Handle <span className="text-red-400">*</span></Label>
        <Input id="inf_name" placeholder="Ex: @joaosilva" {...register('name')}
          className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <Instagram className="w-3.5 h-3.5 text-pink-400" />Instagram
        </Label>
        <Input placeholder="@usuario" {...register('instagram')}
          className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <span className="text-[#69C9D0] font-bold text-[10px] w-3.5 inline-block">TK</span>TikTok
        </Label>
        <Input placeholder="@usuario" {...register('tiktok')}
          className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <span className="text-[#1DA1F2] font-bold text-[10px] w-3.5 inline-block">X</span>Twitter / X
        </Label>
        <Input placeholder="@usuario" {...register('twitter')}
          className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
      </div>

      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <Percent className="w-3.5 h-3.5" />Comissão (%)
        </Label>
        <Input type="number" min={0} max={100} step={0.1} placeholder="0"
          {...register('percentage', { valueAsNumber: true })}
          className="bg-[hsl(var(--card))] border-[hsl(var(--border))]" />
        {errors.percentage && <p className="text-xs text-red-400">{errors.percentage.message}</p>}
      </div>

      <div className="flex items-center gap-3 pt-1">
        <Switch id="inf_active" checked={isActive ?? true} onCheckedChange={(v: boolean) => setValue('is_active', v)} />
        <Label htmlFor="inf_active" className="cursor-pointer">Influenciador ativo</Label>
      </div>

      <DialogFooter className="pt-2 border-t border-[hsl(var(--border))]">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand)/0.9)] text-white">
          {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Criar Influenciador'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ── Main Dialog ──────────────────────────────────────────────────────────────

interface ResponsavelFormDialogProps {
  open: boolean;
  onClose: () => void;
  tab: ResponsavelTab;
  editItem?: Testador | Titular | Influenciador | null;
  onSaveTestador: (data: TestadorFormData, id?: string) => Promise<void>;
  onSaveTitular: (data: TitularFormData, id?: string) => Promise<void>;
  onSaveInfluenciador: (data: InfluenciadorFormData, id?: string) => Promise<void>;
}

export function ResponsavelFormDialog({
  open,
  onClose,
  tab,
  editItem,
  onSaveTestador,
  onSaveTitular,
  onSaveInfluenciador,
}: ResponsavelFormDialogProps) {
  const config = TAB_CONFIG[tab];
  const Icon = config.icon;
  const isEditing = !!editItem;

  const testadorDefaults = editItem && tab === 'testadores' ? (() => {
    const t = editItem as Testador;
    return {
      full_name: t.full_name,
      document_type: (t.document_type || 'cpf') as TestadorFormData['document_type'],
      document_number: t.document_number ?? undefined,
      rg: t.rg ?? undefined,
      birth_date: t.birth_date ?? undefined,
      phone: t.phone ?? undefined,
      email: t.email ?? undefined,
      notes: t.notes ?? undefined,
      is_active: t.is_active,
    };
  })() : undefined;

  const titularDefaults = editItem && tab === 'titulares' ? (() => {
    const t = editItem as Titular;
    return {
      full_name: t.full_name,
      document_type: (t.document_type || 'cpf') as TitularFormData['document_type'],
      document_number: t.document_number ?? undefined,
      rg: t.rg ?? undefined,
      birth_date: t.birth_date ?? undefined,
      phone: t.phone ?? undefined,
      email: t.email ?? undefined,
      notes: t.notes ?? undefined,
    };
  })() : undefined;

  const influenciadorDefaults = editItem && tab === 'influenciadores' ? (() => {
    const i = editItem as Influenciador;
    return {
      name: i.name,
      instagram: i.instagram ?? undefined,
      tiktok: i.tiktok ?? undefined,
      twitter: i.twitter ?? undefined,
      percentage: i.percentage,
      is_active: i.is_active,
    };
  })() : undefined;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-lg font-semibold">
            <span className="p-1.5 rounded-md bg-[hsl(var(--muted))]">
              <Icon className="w-4 h-4" />
            </span>
            {isEditing ? `Editar ${config.label}` : `Novo ${config.label}`}
          </DialogTitle>
        </DialogHeader>

        <div className="py-2 max-h-[65vh] overflow-y-auto pr-1">
          {tab === 'testadores' && (
            <TestadorForm
              key={editItem?.id ?? 'new-testador'}
              defaultValues={testadorDefaults}
              isEditing={isEditing}
              onCancel={onClose}
              onSubmit={async (data) => {
                await onSaveTestador(data, editItem?.id);
                onClose();
              }}
            />
          )}
          {tab === 'titulares' && (
            <TitularForm
              key={editItem?.id ?? 'new-titular'}
              defaultValues={titularDefaults}
              isEditing={isEditing}
              onCancel={onClose}
              onSubmit={async (data) => {
                await onSaveTitular(data, editItem?.id);
                onClose();
              }}
            />
          )}
          {tab === 'influenciadores' && (
            <InfluenciadorForm
              key={editItem?.id ?? 'new-influenciador'}
              defaultValues={influenciadorDefaults}
              isEditing={isEditing}
              onCancel={onClose}
              onSubmit={async (data) => {
                await onSaveInfluenciador(data, editItem?.id);
                onClose();
              }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
