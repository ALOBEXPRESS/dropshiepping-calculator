import React, { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { userId, email, profile, refreshProfile } = useUser();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    first_name: profile?.first_name ?? '',
    last_name: profile?.last_name ?? '',
    phone: profile?.phone ?? '',
    address: profile?.address ?? '',
    city: profile?.city ?? '',
    state: profile?.state ?? '',
    zip: profile?.zip ?? '',
    country: profile?.country ?? 'Brasil',
    avatar_url: profile?.avatar_url ?? '',
  });

  // Sync form when profile loads
  React.useEffect(() => {
    if (profile) {
      setForm({
        first_name: profile.first_name ?? '',
        last_name: profile.last_name ?? '',
        phone: profile.phone ?? '',
        address: profile.address ?? '',
        city: profile.city ?? '',
        state: profile.state ?? '',
        zip: profile.zip ?? '',
        country: profile.country ?? 'Brasil',
        avatar_url: profile.avatar_url ?? '',
      });
    }
  }, [profile]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/avatar.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setForm(f => ({ ...f, avatar_url: url }));
      toast.success('Foto atualizada!');
    } catch {
      toast.error('Erro ao enviar foto.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('user_profiles').upsert({
        id: userId,
        ...form,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      await refreshProfile();
      toast.success('Perfil salvo com sucesso!');
    } catch {
      toast.error('Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Meu Perfil</h1>
        <p className="text-sm text-zinc-400 mt-0.5">Gerencie suas informações pessoais</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar */}
        <div className="flex items-center gap-5 p-5 rounded-xl bg-zinc-900 border border-zinc-800">
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage src={form.avatar_url || undefined} />
              <AvatarFallback className="text-xl bg-zinc-700 text-white">
                {form.first_name?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-orange-500 hover:bg-orange-600 rounded-full flex items-center justify-center transition-colors"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-white" /> : <Camera className="w-3.5 h-3.5 text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Foto de perfil</p>
            <p className="text-xs text-zinc-500 mt-0.5">JPG, PNG ou WEBP. Máx 5MB.</p>
            <button type="button" onClick={() => fileRef.current?.click()} className="text-xs text-orange-400 hover:text-orange-300 mt-1 transition-colors">
              Alterar foto
            </button>
          </div>
        </div>

        {/* Dados pessoais */}
        <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-widest">Informações Pessoais</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Nome <span className="text-red-400">*</span></Label>
              <Input value={form.first_name} onChange={f('first_name')} placeholder="Jonatan" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Sobrenome</Label>
              <Input value={form.last_name} onChange={f('last_name')} placeholder="Silva" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">Email</Label>
            <Input value={email ?? ''} readOnly className="bg-zinc-800/50 border-zinc-700 text-zinc-400 cursor-not-allowed" />
            <p className="text-[11px] text-zinc-600">O email não pode ser alterado por aqui.</p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">Telefone</Label>
            <Input value={form.phone} onChange={f('phone')} placeholder="+55 21 99999-9999" className="bg-zinc-800 border-zinc-700 text-white" />
          </div>
        </div>

        {/* Endereço */}
        <div className="p-5 rounded-xl bg-zinc-900 border border-zinc-800 space-y-4">
          <h2 className="text-sm font-semibold text-white uppercase tracking-widest">Endereço</h2>

          <div className="space-y-1.5">
            <Label className="text-zinc-300 text-sm">Rua / Número</Label>
            <Input value={form.address} onChange={f('address')} placeholder="Rua Exemplo, 123" className="bg-zinc-800 border-zinc-700 text-white" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Cidade</Label>
              <Input value={form.city} onChange={f('city')} placeholder="Rio de Janeiro" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">Estado</Label>
              <Input value={form.state} onChange={f('state')} placeholder="RJ" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">CEP</Label>
              <Input value={form.zip} onChange={f('zip')} placeholder="23570-080" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-zinc-300 text-sm">País</Label>
              <Input value={form.country} onChange={f('country')} placeholder="Brasil" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600 text-white px-8">
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Salvando...</> : 'Salvar Alterações'}
          </Button>
        </div>
      </form>
    </div>
  );
}
