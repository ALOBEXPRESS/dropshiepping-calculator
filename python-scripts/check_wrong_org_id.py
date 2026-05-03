#!/usr/bin/env python3
"""
Verificar pedidos com organization_id errado
"""

from supabase import create_client

SUPABASE_URL = "https://oensqhjnxwpcuanozske.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTMyNzIsImV4cCI6MjA4MTk4OTI3Mn0.msBzSx-6KOSLP3YLALIy7vPM17fT1PV9uv8zJ_8LRZA"

OLD_ORG_ID = "e3274f4d-2627-4121-895d-b0e3a70b0ace"
NEW_ORG_ID = "28b4b443-03fd-4a2d-b596-9dcaf142b389"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🔍 Procurando pedidos com organization_id ERRADO...\n")

# Verificar bling_orders
print("=" * 60)
print("BLING_ORDERS com ID ERRADO")
print("=" * 60)

result = supabase.table("bling_orders").select("*").eq("organization_id", OLD_ORG_ID).limit(10).execute()
print(f"Total: {len(result.data)} pedidos")

if result.data:
    print("\nPrimeiros 10:")
    for order in result.data:
        print(f"  - Order #{order.get('order_number')}, Estado: {order.get('label_state')}, Criado: {order.get('created_at')}")

# Verificar orders
print("\n" + "=" * 60)
print("ORDERS com ID ERRADO")
print("=" * 60)

result = supabase.table("orders").select("*").eq("organization_id", OLD_ORG_ID).limit(10).execute()
print(f"Total: {len(result.data)} pedidos")

if result.data:
    print("\nPrimeiros 10:")
    for order in result.data:
        print(f"  - Order #{order.get('order_number')}, Total: R$ {order.get('total_amount')}, Criado: {order.get('created_at')}")

# Verificar TODOS os organization_ids
print("\n" + "=" * 60)
print("TODOS OS ORGANIZATION_IDS NO BANCO")
print("=" * 60)

result = supabase.table("bling_orders").select("organization_id").execute()
org_ids = set(order.get('organization_id') for order in result.data if order.get('organization_id'))
print(f"Organization IDs em bling_orders: {org_ids}")

result = supabase.table("orders").select("organization_id").execute()
org_ids = set(order.get('organization_id') for order in result.data if order.get('organization_id'))
print(f"Organization IDs em orders: {org_ids}")
