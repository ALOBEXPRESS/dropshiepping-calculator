#!/usr/bin/env python3
"""
Verificação simples de pedidos
"""

import os
from supabase import create_client

SUPABASE_URL = "https://oensqhjnxwpcuanozske.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTMyNzIsImV4cCI6MjA4MTk4OTI3Mn0.msBzSx-6KOSLP3YLALIy7vPM17fT1PV9uv8zJ_8LRZA"
ORG_ID = "28b4b443-03fd-4a2d-b596-9dcaf142b389"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("=" * 60)
print("VERIFICANDO TABELA BLING_ORDERS")
print("=" * 60)

result = supabase.table("bling_orders").select("*").limit(5).execute()
print(f"Total de registros em bling_orders: {len(result.data)}")
if result.data:
    print("\nPrimeiros 5 registros:")
    for order in result.data:
        print(f"  - ID: {order.get('id')}, Org: {order.get('organization_id')}, Estado: {order.get('label_state')}")

print("\n" + "=" * 60)
print("VERIFICANDO TABELA ORDERS")
print("=" * 60)

result = supabase.table("orders").select("*").eq("organization_id", ORG_ID).order("created_at", desc=True).limit(5).execute()
print(f"Total de pedidos com org_id correto: {len(result.data)}")
if result.data:
    print("\nÚltimos 5 pedidos:")
    for order in result.data:
        print(f"  - ID: {order.get('id')}")
        print(f"    Order Number: {order.get('order_number')}")
        print(f"    Bling Order ID: {order.get('bling_order_id')}")
        print(f"    Total: R$ {order.get('total_amount')}")
        print(f"    Criado em: {order.get('created_at')}")
        print()

print("=" * 60)
print("VERIFICANDO TABELA ORDER_ITEMS")
print("=" * 60)

if result.data:
    order_id = result.data[0]['id']
    items_result = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
    print(f"Itens do último pedido: {len(items_result.data)}")
    for item in items_result.data:
        print(f"  - {item.get('description')}: {item.get('quantity')}x R$ {item.get('unit_value')}")
