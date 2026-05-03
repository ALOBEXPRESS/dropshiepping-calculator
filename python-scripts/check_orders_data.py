#!/usr/bin/env python3
"""
Verificar dados de pedidos no banco para debug do mapa
"""

import os
from supabase import create_client

# Configuração do Supabase
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "https://oensqhjnxwpcuanozske.supabase.co")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTMyNzIsImV4cCI6MjA4MTk4OTI3Mn0.msBzSx-6KOSLP3YLALIy7vPM17fT1PV9uv8zJ_8LRZA")

ORG_ID = "28b4b443-03fd-4a2d-b596-9dcaf142b389"

def main():
    print("🔍 Verificando dados de pedidos...\n")
    
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    
    # 1. Verificar último pedido em bling_orders
    print("=" * 60)
    print("1. ÚLTIMO PEDIDO EM BLING_ORDERS")
    print("=" * 60)
    
    result = supabase.table("bling_orders") \
        .select("bling_order_id, order_number, organization_id, label_state, label_city, created_at") \
        .eq("organization_id", ORG_ID) \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute()
    
    if result.data:
        order = result.data[0]
        print(f"✅ Pedido encontrado:")
        print(f"   - Bling Order ID: {order['bling_order_id']}")
        print(f"   - Order Number: {order['order_number']}")
        print(f"   - Organization ID: {order['organization_id']}")
        print(f"   - Estado: {order['label_state']}")
        print(f"   - Cidade: {order['label_city']}")
        print(f"   - Criado em: {order['created_at']}")
    else:
        print("❌ Nenhum pedido encontrado em bling_orders")
    
    # 2. Contar pedidos por estado
    print("\n" + "=" * 60)
    print("2. CONTAGEM DE PEDIDOS POR ESTADO")
    print("=" * 60)
    
    result = supabase.table("bling_orders") \
        .select("label_state") \
        .eq("organization_id", ORG_ID) \
        .is_("label_state", "not.null") \
        .execute()
    
    if result.data:
        states = {}
        for order in result.data:
            state = order['label_state']
            if state:
                states[state] = states.get(state, 0) + 1
        
        print(f"✅ Total de pedidos com estado: {len(result.data)}")
        print(f"✅ Estados únicos: {len(states)}")
        print("\nDistribuição:")
        for state, count in sorted(states.items(), key=lambda x: x[1], reverse=True):
            print(f"   - {state}: {count} pedidos")
    else:
        print("❌ Nenhum pedido com estado encontrado")
    
    # 3. Verificar último pedido em orders (processado)
    print("\n" + "=" * 60)
    print("3. ÚLTIMO PEDIDO EM ORDERS (PROCESSADO)")
    print("=" * 60)
    
    result = supabase.table("orders") \
        .select("id, order_number, organization_id, bling_order_id, created_at") \
        .eq("organization_id", ORG_ID) \
        .order("created_at", desc=True) \
        .limit(1) \
        .execute()
    
    if result.data:
        order = result.data[0]
        print(f"✅ Pedido processado encontrado:")
        print(f"   - Order ID: {order['id']}")
        print(f"   - Order Number: {order['order_number']}")
        print(f"   - Organization ID: {order['organization_id']}")
        print(f"   - Bling Order ID: {order.get('bling_order_id', 'N/A')}")
        print(f"   - Criado em: {order['created_at']}")
        
        # Buscar dados de localização do bling_order
        if order.get('bling_order_id'):
            bling_result = supabase.table("bling_orders") \
                .select("label_state, label_city") \
                .eq("id", order['bling_order_id']) \
                .single() \
                .execute()
            
            if bling_result.data:
                print(f"   - Estado (do bling_order): {bling_result.data.get('label_state', 'N/A')}")
                print(f"   - Cidade (do bling_order): {bling_result.data.get('label_city', 'N/A')}")
    else:
        print("❌ Nenhum pedido processado encontrado em orders")
    
    # 4. Verificar itens do último pedido
    print("\n" + "=" * 60)
    print("4. ITENS DO ÚLTIMO PEDIDO")
    print("=" * 60)
    
    if result.data:
        order_id = result.data[0]['id']
        items_result = supabase.table("order_items") \
            .select("id, description, quantity, unit_value, total_value") \
            .eq("order_id", order_id) \
            .execute()
        
        if items_result.data:
            print(f"✅ {len(items_result.data)} itens encontrados:")
            for item in items_result.data:
                print(f"   - {item['description']}: {item['quantity']}x R$ {item['unit_value']} = R$ {item['total_value']}")
        else:
            print("❌ Nenhum item encontrado para este pedido")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"\n❌ ERRO: {e}")
        import traceback
        traceback.print_exc()
