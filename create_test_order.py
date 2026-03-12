#!/usr/bin/env python3
"""
Criar pedido de teste para validar o mapa
"""

from supabase import create_client
import uuid
from datetime import datetime

SUPABASE_URL = "https://oensqhjnxwpcuanozske.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTMyNzIsImV4cCI6MjA4MTk4OTI3Mn0.msBzSx-6KOSLP3YLALIy7vPM17fT1PV9uv8zJ_8LRZA"
ORG_ID = "28b4b443-03fd-4a2d-b596-9dcaf142b389"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🚀 Criando pedidos de teste...\n")

# Criar pedidos em diferentes estados
test_orders = [
    {"state": "SP", "city": "São Paulo", "order_number": 1001},
    {"state": "RJ", "city": "Rio de Janeiro", "order_number": 1002},
    {"state": "MG", "city": "Belo Horizonte", "order_number": 1003},
    {"state": "SP", "city": "Campinas", "order_number": 1004},
    {"state": "RS", "city": "Porto Alegre", "order_number": 1005},
]

for order_data in test_orders:
    print(f"Criando pedido {order_data['order_number']} - {order_data['city']}/{order_data['state']}")
    
    # Inserir em bling_orders
    bling_order = {
        "bling_order_id": 999000 + order_data['order_number'],
        "organization_id": ORG_ID,
        "order_number": order_data['order_number'],
        "marketplace_order_number": f"MKT-{order_data['order_number']}",
        "bling_store_id": 205833031,
        "order_date": datetime.now().date().isoformat(),
        "total_products": 100.00,
        "total_amount": 150.00,
        "status_id": 1,
        "status_value": 150.00,
        "contact_name": "Cliente Teste",
        "label_state": order_data['state'],
        "label_city": order_data['city'],
        "label_zip": "01000-000",
        "label_neighborhood": "Centro",
        "sync_status": "synced",
        "last_sync_at": datetime.now().isoformat()
    }
    
    result = supabase.table("bling_orders").insert(bling_order).execute()
    
    if result.data:
        print(f"  ✅ Pedido criado em bling_orders: ID {result.data[0]['id']}")
    else:
        print(f"  ❌ Erro ao criar pedido")

print("\n✅ Pedidos de teste criados!")
print("\n🔍 Verificando...")

result = supabase.table("bling_orders").select("order_number, label_state, label_city").eq("organization_id", ORG_ID).execute()
print(f"\nTotal de pedidos: {len(result.data)}")
for order in result.data:
    print(f"  - {order['order_number']}: {order['label_city']}/{order['label_state']}")
