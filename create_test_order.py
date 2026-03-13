import os
from supabase import create_client, Client
from datetime import date

# Configuração do Supabase
url = "https://oensqhjnxwpcuanozske.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTMyNzIsImV4cCI6MjA4MTk4OTI3Mn0.msBzSx-6KOSLP3YLALIy7vPM17fT1PV9uv8zJ_8LRZA"

supabase: Client = create_client(url, key)

# ID da organização
organization_id = "28b4b443-03fd-4a2d-b596-9dcaf142b389"

# Criar um pedido de teste
test_order = {
    "organization_id": organization_id,
    "bling_order_id": 999999,  # ID fictício
    "order_number": 999999,
    "order_date": str(date.today()),
    "total_amount": 100.00,
    "status_id": 1,
    "contact_name": "Cliente Teste",
    "label_state": "SP",  # Estado de São Paulo
    "label_city": "São Paulo",
    "label_zip": "01000-000"
}

try:
    response = supabase.table("bling_orders").insert(test_order).execute()
    print("✅ Pedido de teste criado com sucesso!")
    print(f"   Estado: {test_order['label_state']}")
    print(f"   Cidade: {test_order['label_city']}")
    print(f"   Valor: R$ {test_order['total_amount']}")
except Exception as e:
    print(f"❌ Erro ao criar pedido: {e}")
