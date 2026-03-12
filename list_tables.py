#!/usr/bin/env python3
"""
Listar todas as tabelas do banco
"""

from supabase import create_client

SUPABASE_URL = "https://oensqhjnxwpcuanozske.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTMyNzIsImV4cCI6MjA4MTk4OTI3Mn0.msBzSx-6KOSLP3YLALIy7vPM17fT1PV9uv8zJ_8LRZA"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🔍 Listando tabelas do banco...\n")

# Tentar algumas tabelas comuns
tables_to_check = [
    "users",
    "profiles", 
    "organizations",
    "user_organizations",
    "bling_orders",
    "orders",
    "order_items",
    "leads",
    "sales_channels",
    "products_bling",
    "products_variations_bling",
    "bling_tokens",
    "bling_sync_logs"
]

print("=" * 60)
print("VERIFICANDO TABELAS")
print("=" * 60)

for table in tables_to_check:
    try:
        result = supabase.table(table).select("*", count="exact").limit(0).execute()
        print(f"✅ {table:30} - {result.count or 0} registros")
    except Exception as e:
        error_msg = str(e)
        if "Could not find the table" in error_msg:
            print(f"❌ {table:30} - Não existe")
        else:
            print(f"⚠️  {table:30} - Erro: {error_msg[:50]}")

print("\n" + "=" * 60)
print("VERIFICANDO DADOS EM TABELAS EXISTENTES")
print("=" * 60)

# Verificar bling_orders
try:
    result = supabase.table("bling_orders").select("organization_id").execute()
    org_ids = set(order.get('organization_id') for order in result.data if order.get('organization_id'))
    print(f"\nbling_orders:")
    print(f"   Total: {len(result.data)} registros")
    print(f"   Organization IDs únicos: {org_ids if org_ids else 'Nenhum'}")
except Exception as e:
    print(f"\n❌ Erro ao verificar bling_orders: {e}")

# Verificar orders
try:
    result = supabase.table("orders").select("organization_id").execute()
    org_ids = set(order.get('organization_id') for order in result.data if order.get('organization_id'))
    print(f"\norders:")
    print(f"   Total: {len(result.data)} registros")
    print(f"   Organization IDs únicos: {org_ids if org_ids else 'Nenhum'}")
except Exception as e:
    print(f"\n❌ Erro ao verificar orders: {e}")
