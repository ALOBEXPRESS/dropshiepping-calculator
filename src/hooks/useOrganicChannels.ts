import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface OrganicChannel {
  id: string;
  key: string;
  label: string;
  is_active: boolean;
  display_order: number;
}

export const useOrganicChannels = () => {
  const [channels, setChannels] = useState<OrganicChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('organic_traffic_channels')
          .select('*')
          .eq('is_active', true)
          .order('display_order', { ascending: true });

        if (fetchError) throw fetchError;

        setChannels(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching organic channels:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch channels');
        // Fallback para canais hardcoded em caso de erro
        setChannels([
          { id: '1', key: 'youtube_shorts', label: 'Youtube Shorts', is_active: true, display_order: 1 },
          { id: '2', key: 'kaway_video', label: 'Kaway Video', is_active: true, display_order: 2 },
          { id: '3', key: 'tiktok', label: 'Tiktok', is_active: true, display_order: 3 },
          { id: '4', key: 'instagram_reels', label: 'Instagram Reels', is_active: true, display_order: 4 },
          { id: '5', key: 'whatsapp', label: 'WhatsApp', is_active: true, display_order: 5 },
          { id: '6', key: 'facebook_group', label: 'Grupo Facebook', is_active: true, display_order: 6 },
          { id: '7', key: 'shopee_video', label: 'Shopee Vídeo', is_active: true, display_order: 7 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchChannels();
  }, []);

  return { channels, loading, error };
};
