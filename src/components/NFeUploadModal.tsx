import React, { useState, useRef, useCallback } from 'react';
import { X, Upload, FileText, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useSettings } from '@/contexts/SettingsContext';

interface NFeUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ParsedNFe {
  nNF: number;
  dhEmi: string;
  totalNF: number;
  totalProdutos: number;
  frete: number;
  desconto: number;
  vLiq: number;
  contactName: string;
  contactCpf: string | null;
  contactCnpj: string | null;
  labelName: string;
  labelCity: string;
  labelState: string;
  labelZip: string;
  labelStreet: string;
  items: { descricao: string; qtd: number; vUnit: number; vTotal: number; sku: string }[];
  intermediadorCnpj: string | null;
  chNFe: string;
}

function parseNFe(xml: string): ParsedNFe {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const ns = 'http://www.portalfiscal.inf.br/nfe';

  const g = (tag: string, scope?: Element) =>
    (scope ?? doc).getElementsByTagNameNS(ns, tag)[0]?.textContent?.trim() ?? '';

  const ide = doc.getElementsByTagNameNS(ns, 'ide')[0];
  const dest = doc.getElementsByTagNameNS(ns, 'dest')[0];
  const enderDest = doc.getElementsByTagNameNS(ns, 'enderDest')[0];
  const total = doc.getElementsByTagNameNS(ns, 'ICMSTot')[0];
  const cobr = doc.getElementsByTagNameNS(ns, 'fat')[0];
  const infIntermed = doc.getElementsByTagNameNS(ns, 'infIntermed')[0];

  // Items
  const detNodes = doc.getElementsByTagNameNS(ns, 'det');
  const items = Array.from(detNodes).map(det => {
    const prod = det.getElementsByTagNameNS(ns, 'prod')[0];
    return {
      descricao: g('xProd', prod),
      sku: g('cProd', prod),
      qtd: parseFloat(g('qCom', prod) || '1'),
      vUnit: parseFloat(g('vUnCom', prod) || '0'),
      vTotal: parseFloat(g('vProd', prod) || '0'),
    };
  });

  const frete = parseFloat(g('vFrete', total) || '0');
  const totalProdutos = parseFloat(g('vProd', total) || '0');
  const totalNF = parseFloat(g('vNF', total) || '0');
  const desconto = parseFloat(g('vDesc', total) || '0');
  const vLiq = parseFloat(g('vLiq', cobr) || String(totalNF));

  const dhEmi = g('dhEmi', ide);
  const orderDate = dhEmi ? dhEmi.split('T')[0] : new Date().toISOString().split('T')[0];

  return {
    nNF: parseInt(g('nNF', ide) || '0'),
    dhEmi: orderDate,
    totalNF,
    totalProdutos,
    frete,
    desconto,
    vLiq,
    contactName: g('xNome', dest),
    contactCpf: dest?.getElementsByTagNameNS(ns, 'CPF')[0]?.textContent?.trim() || null,
    contactCnpj: dest?.getElementsByTagNameNS(ns, 'CNPJ')[0]?.textContent?.trim() || null,
    labelName: g('xNome', enderDest?.parentElement ?? dest),
    labelCity: g('xMun', enderDest),
    labelState: g('UF', enderDest),
    labelZip: g('CEP', enderDest),
    labelStreet: `${g('xLgr', enderDest)}, ${g('nro', enderDest)}`,
    items,
    intermediadorCnpj: infIntermed?.getElementsByTagNameNS(ns, 'CNPJ')[0]?.textContent?.trim() || null,
    chNFe: doc.getElementsByTagNameNS(ns, 'chNFe')[0]?.textContent?.trim() ?? String(Date.now()),
  };
}

// Map intermediador CNPJ to marketplace name
const INTERMEDIADOR_MAP: Record<string, string> = {
  '27415911000136': 'TikTok Shop',
  '20956256000178': 'Shopee',
  '03007331000104': 'Mercado Livre',
};

// Direct CNPJ → sales_channel_id + marketplace_id (most reliable, no DB query needed)
const CNPJ_TO_CHANNEL_INFO: Record<string, { salesChannelId: string; marketplaceId: string }> = {
  '27415911000136': {
    salesChannelId: '18cc394e-edd5-4a88-b412-f7170acfe9ad', // TikTok Shop
    marketplaceId: 'c736e8ae-b765-44b6-b23f-468639bd8c13',  // TikTok marketplace
  },
  '20956256000178': {
    salesChannelId: '35bad7f8-3237-440d-ad73-11b4d1353495', // Shopee
    marketplaceId: '91cbf5ca-edd3-469a-b723-d8bb240d641a',  // Shopee marketplace
  },
  '03007331000104': {
    salesChannelId: 'e1c613fc-edf8-400b-a0d1-0452835f0231', // MercadoLivre
    marketplaceId: 'a60c0efb-be3d-41f4-b730-0f3891e59200',  // Mercado Livre marketplace
  },
};

export function NFeUploadModal({ open, onClose, onSuccess }: NFeUploadModalProps) {
  const { organizationId } = useSettings();
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'saving' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [parsed, setParsed] = useState<ParsedNFe | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => { setStatus('idle'); setErrorMsg(''); setParsed(null); };

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith('.xml')) {
      setErrorMsg('Arquivo deve ser .xml');
      setStatus('error');
      return;
    }
    setStatus('parsing');
    try {
      const text = await file.text();
      const nfe = parseNFe(text);
      setParsed(nfe);
      setStatus('saving');

      // Resolve marketplace name from intermediador CNPJ
      const marketplaceName = nfe.intermediadorCnpj
        ? (INTERMEDIADOR_MAP[nfe.intermediadorCnpj] ?? 'Manual')
        : 'Manual';

      // Use hardcoded CNPJ map as primary source (most reliable, avoids bad column queries)
      const cnpjInfo = nfe.intermediadorCnpj ? CNPJ_TO_CHANNEL_INFO[nfe.intermediadorCnpj] : null;
      let salesChannelId: string | null = cnpjInfo?.salesChannelId ?? null;
      let resolvedMarketplaceId: string | null = cnpjInfo?.marketplaceId ?? null;
      let blingStoreId = 0;

      // If no hardcoded match, query DB by name
      if (!salesChannelId && marketplaceName !== 'Manual') {
        const { data: scRows } = await supabase
          .from('sales_channels')
          .select('id, bling_store_id, marketplace_id')
          .ilike('name', `%${marketplaceName}%`)
          .limit(1);
        if (scRows?.[0]) {
          salesChannelId = scRows[0].id;
          resolvedMarketplaceId = scRows[0].marketplace_id ?? null;
          blingStoreId = scRows[0].bling_store_id ?? 0;
        }
      }

      // Use chNFe hash as synthetic bling_order_id (negative to avoid collision)
      const syntheticBlingId = -Math.abs(parseInt(nfe.chNFe.slice(-8), 16) % 2147483647);

      // Check if already inserted (by chNFe stored in marketplace_order_number)
      const { data: existingByChNFe } = await supabase
        .from('bling_orders')
        .select('id')
        .eq('marketplace_order_number', `NF-chave-${nfe.chNFe}`)
        .limit(1);

      if (existingByChNFe && existingByChNFe.length > 0) {
        setErrorMsg('NF-e já foi importada anteriormente.');
        setStatus('error');
        return;
      }

      // Check if already inserted (legacy: by synthetic bling_order_id)
      const { data: existing } = await supabase
        .from('bling_orders')
        .select('id')
        .eq('bling_order_id', syntheticBlingId)
        .limit(1);

      if (existing && existing.length > 0) {
        setErrorMsg('NF-e já foi importada anteriormente.');
        setStatus('error');
        return;
      }

      // --- Match NF to existing pending Bling order ---
      // Try to find unprocessed order with same CPF/CNPJ + matching product value
      const destDoc = nfe.contactCpf ?? nfe.contactCnpj ?? null;
      let matchedBlingOrderId: string | null = null;

      if (destDoc) {
        const cleanDoc = destDoc.replace(/\D/g, '');
        // Find unprocessed orders for same contact + similar total_products value (±R$1)
        const { data: candidateOrders } = await supabase
          .from('bling_orders')
          .select('id, bling_order_id, order_number, total_products, total_amount')
          .eq('organization_id', organizationId)
          .eq('contact_document', cleanDoc)
          .eq('processed_to_orders', false)
          .gte('total_products', nfe.totalProdutos - 1)
          .lte('total_products', nfe.totalProdutos + 1)
          .limit(5);

        if (candidateOrders && candidateOrders.length > 0) {
          // Prefer most recent match
          matchedBlingOrderId = candidateOrders[0].id;
        }
      }

      // If matched existing order, tag it with NF chave and skip creating synthetic
      if (matchedBlingOrderId) {
        await supabase.from('bling_orders').update({
          marketplace_order_number: `NF-chave-${nfe.chNFe}`,
          order_date: nfe.dhEmi,
        }).eq('id', matchedBlingOrderId);

        setStatus('success');
        setTimeout(() => { onSuccess(); onClose(); reset(); }, 1500);
        return;
      }

      // Look up products by SKU (cProd) or name (xProd) for each item
      // Strip accents for fuzzy name match
      const stripAccents = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const itemProductIds: Record<number, { productId: string | null; costPrice: number; imageUrl: string | null }> = {};
      for (let i = 0; i < nfe.items.length; i++) {
        const item = nfe.items[i];
        // 1. Try exact SKU in products
        if (item.sku) {
          const { data: bySku } = await supabase.from('products').select('id, cost_price, image_url').eq('organization_id', organizationId).eq('sku', item.sku).limit(1);
          if (bySku?.[0]) { itemProductIds[i] = { productId: bySku[0].id, costPrice: bySku[0].cost_price ?? 0, imageUrl: bySku[0].image_url ?? null }; continue; }
        }
        // 2. Fuzzy name match in products — prefer matching marketplace + account_holder (CNPJ)
        const words = stripAccents(item.descricao).split(/\s+/).slice(0, 3).join(' ');
        const { data: byName } = await supabase.from('products').select('id, cost_price, image_url, marketplace, account_type').eq('organization_id', organizationId).ilike('name', `%${words.split(' ')[0]}%`).limit(10);
        // Prefer product that matches marketplace name and account_type=cnpj
        const best = byName?.find(p => {
          const pNameStripped = stripAccents((p as unknown as { name?: string }).name ?? '');
          const matchesName = pNameStripped.includes(words.split(' ')[1] ?? words.split(' ')[0]);
          const matchesMarketplace = (p as { marketplace?: string }).marketplace?.toLowerCase().includes(marketplaceName.toLowerCase().split(' ')[0] ?? '');
          const matchesCnpj = (p as { account_type?: string }).account_type === 'cnpj';
          return matchesName && matchesMarketplace && matchesCnpj;
        }) ?? byName?.find(p => {
          const pNameStripped = stripAccents((p as unknown as { name?: string }).name ?? '');
          return pNameStripped.includes(words.split(' ')[1] ?? words.split(' ')[0]);
        }) ?? byName?.[0];
        if (best) { itemProductIds[i] = { productId: best.id, costPrice: best.cost_price ?? 0, imageUrl: best.image_url ?? null }; continue; }
        // 3. Try products_variations by name
        const { data: byVarName } = await supabase.from('product_variations').select('id, product_id, cost_price, image_url').ilike('name', `%${words.split(' ')[0]}%`).limit(1);
        const pv = byVarName?.[0];
        if (pv) { itemProductIds[i] = { productId: pv.product_id ?? null, costPrice: pv.cost_price ?? 0, imageUrl: pv.image_url ?? null }; continue; }
        itemProductIds[i] = { productId: null, costPrice: 0, imageUrl: null };
      }

      // Upsert lead from NF dest data — find by CPF/CNPJ or create new
      let leadId: string | null = null;
      // destDoc already declared above in match section
      if (destDoc) {
        const cleanDoc = destDoc.replace(/\D/g, '');
        // Try find existing lead by document
        const { data: existingLead } = await supabase
          .from('leads')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('document_number', cleanDoc)
          .limit(1);
        if (existingLead?.[0]) {
          leadId = existingLead[0].id;
          // Update marketplace_id if currently null
          if (resolvedMarketplaceId) {
            await supabase.from('leads').update({ marketplace_id: resolvedMarketplaceId }).eq('id', leadId);
          }
        } else {
          // Create new lead from NF dest with correct marketplace_id
          const { data: newLead } = await supabase.from('leads').insert({
            organization_id: organizationId,
            name: nfe.contactName,
            document_type: nfe.contactCpf ? 'CPF' : 'CNPJ',
            document_number: cleanDoc,
            address_street: nfe.labelStreet,
            address_city: nfe.labelCity,
            address_state: nfe.labelState,
            address_zip: nfe.labelZip,
            marketplace_id: resolvedMarketplaceId,
            lead_status: 'new',
            lead_source: marketplaceName,
          }).select('id').single();
          leadId = newLead?.id ?? null;
        }
      }

      const { data: orderRow, error: insertError } = await supabase.from('bling_orders').insert({
        organization_id: organizationId,
        bling_order_id: syntheticBlingId,
        order_number: nfe.nNF,
        marketplace_order_number: `NF-${nfe.nNF}`,
        sales_channel_id: salesChannelId,
        bling_store_id: blingStoreId,
        lead_id: leadId,
        order_date: nfe.dhEmi,
        total_products: nfe.totalProdutos,
        total_amount: nfe.vLiq,
        discount_value: nfe.desconto,
        shipping_cost: nfe.frete,
        other_expenses: 0,
        status_id: 9,
        contact_name: nfe.contactName,
        contact_type: nfe.contactCnpj ? 'J' : 'F',
        contact_document: nfe.contactCpf ?? nfe.contactCnpj ?? '',
        label_name: nfe.contactName,
        label_city: nfe.labelCity,
        label_state: nfe.labelState,
        label_zip: nfe.labelZip,
        label_address: nfe.labelStreet,
        processed_to_orders: false,
        raw_data: null,
      }).select('id').single();

      if (insertError) throw insertError;

      // Insert bling_order_items for each NF item
      if (orderRow?.id && nfe.items.length > 0) {
        const itemRows = nfe.items.map((item, i) => ({
          order_id: orderRow.id,
          bling_item_id: Math.abs(syntheticBlingId) * 1000 + i,
          product_id: itemProductIds[i]?.productId ?? null,
          code: item.sku ?? '',
          description: item.descricao,
          unit: 'UN',
          quantity: item.qtd,
          unit_value: item.vUnit,
          total_value: item.vTotal,
          discount: 0,
          ipi_rate: 0,
          commission_base: 0,
          commission_rate: 0,
          commission_value: 0,
        }));
        await supabase.from('bling_order_items').insert(itemRows);
      }

      setStatus('success');
      setTimeout(() => { onSuccess(); onClose(); reset(); }, 1500);
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Erro ao importar NF-e');
      setStatus('error');
    }
  }, [organizationId, onClose, onSuccess]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [processFile]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h2 className="text-white font-semibold text-sm">Carregar NF-e</h2>
          </div>
          <button onClick={() => { onClose(); reset(); }} className="text-zinc-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {status === 'success' ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
              <p className="text-white font-semibold">NF-e importada com sucesso!</p>
              {parsed && <p className="text-zinc-400 text-sm">Pedido NF {parsed.nNF} — {parsed.contactName}</p>}
            </div>
          ) : status === 'error' ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-red-400 font-medium text-sm">{errorMsg}</p>
              <Button size="sm" variant="outline" onClick={reset}>Tentar novamente</Button>
            </div>
          ) : (status === 'parsing' || status === 'saving') ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
              <p className="text-zinc-300 text-sm">{status === 'parsing' ? 'Lendo XML...' : 'Salvando pedido...'}</p>
            </div>
          ) : (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                onClick={() => inputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl py-10 px-6 cursor-pointer transition-all ${
                  dragging
                    ? 'border-emerald-400 bg-emerald-950/30'
                    : 'border-zinc-600 hover:border-zinc-400 bg-zinc-800/40 hover:bg-zinc-800/70'
                }`}
              >
                <Upload className={`w-10 h-10 ${dragging ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <div className="text-center">
                  <p className="text-zinc-300 text-sm font-medium">Arraste o arquivo XML da NF-e aqui</p>
                  <p className="text-zinc-500 text-xs mt-1">ou clique para selecionar</p>
                </div>
                <span className="text-[11px] text-zinc-600 font-mono bg-zinc-900 px-2 py-0.5 rounded">.xml</span>
              </div>
              <input
                ref={inputRef}
                type="file"
                accept=".xml,application/xml,text/xml"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
              />
              <p className="text-[11px] text-zinc-600 mt-3 text-center">
                O pedido será adicionado em "Vendas a Processar" após a importação.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
