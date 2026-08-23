/**
 * LeadProductBadge — fetches products purchased by a lead (by contact_name match in bling_orders)
 * Renders compact badges; truncates long names with tooltip on hover.
 */
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Package } from 'lucide-react';

interface Product {
  description: string;
  order_number: number;
}

const cache = new Map<string, Product[]>();

export const LeadProductBadge: React.FC<{
  leadName: string;
  organizationId: string;
}> = ({ leadName, organizationId }) => {
  const [products, setProducts] = useState<Product[]>(() => cache.get(`${organizationId}:${leadName}`) ?? []);
  const [loading, setLoading] = useState(!cache.has(`${organizationId}:${leadName}`));

  useEffect(() => {
    if (!leadName || cache.has(`${organizationId}:${leadName}`)) return;
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      const { data: orders } = await supabase
        .from('bling_orders')
        .select('id, order_number')
        .eq('organization_id', organizationId)
        .ilike('contact_name', `%${leadName.trim()}%`)
        .order('order_date', { ascending: false })
        .limit(5);

      if (!orders || orders.length === 0 || cancelled) {
        cache.set(`${organizationId}:${leadName}`, []);
        setProducts([]);
        setLoading(false);
        return;
      }

      const orderIds = (orders as { id: string; order_number: number }[]).map(o => o.id);
      const orderNumberMap = Object.fromEntries(
        (orders as { id: string; order_number: number }[]).map(o => [o.id, o.order_number])
      );

      const { data: items } = await supabase
        .from('bling_order_items')
        .select('order_id, description')
        .in('order_id', orderIds);

      if (cancelled) return;

      const prods: Product[] = (items ?? []).map((i: { order_id: string; description: string }) => ({
        description: i.description,
        order_number: orderNumberMap[i.order_id] ?? 0,
      }));

      // Deduplicate by description
      const seen = new Set<string>();
      const unique = prods.filter(p => {
        if (seen.has(p.description)) return false;
        seen.add(p.description);
        return true;
      });

      cache.set(`${organizationId}:${leadName}`, unique);
      setProducts(unique);
      setLoading(false);
    };
    fetch();
    return () => { cancelled = true; };
  }, [leadName, organizationId]);

  if (loading) {
    return (
      <div className="flex items-center gap-1">
        <div className="h-4 w-24 animate-pulse rounded bg-zinc-700/50" />
      </div>
    );
  }

  if (products.length === 0) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className="flex flex-col gap-0.5 max-w-[200px]">
      {products.slice(0, 2).map((p, i) => (
        <div key={i} className="flex items-center gap-1 group relative">
          <Package className="w-3 h-3 text-orange-400/70 flex-shrink-0" />
          <span
            className="text-[11px] text-zinc-300 truncate max-w-[170px] cursor-default"
            title={`#${p.order_number} — ${p.description}`}
          >
            {p.description.length > 28 ? p.description.slice(0, 28) + '…' : p.description}
          </span>
        </div>
      ))}
      {products.length > 2 && (
        <span className="text-[10px] text-zinc-500">+{products.length - 2} mais</span>
      )}
    </div>
  );
};
