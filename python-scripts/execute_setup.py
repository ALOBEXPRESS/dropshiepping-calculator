#!/usr/bin/env python3
"""
Executar setup da organization e pedidos de teste
"""

from supabase import create_client
from datetime import date

SUPABASE_URL = "https://oensqhjnxwpcuanozske.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTMyNzIsImV4cCI6MjA4MTk4OTI3Mn0.msBzSx-6KOSLP3YLALIy7vPM17fT1PV9uv8zJ_8LRZA"
ORG_ID = "28b4b443-03fd-4a2d-b596-9dcaf142b389"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🚀 Executando setup da organization e pedidos...\n")

# 1. Criar organization
print("=" * 60)
print("1. CRIANDO ORGANIZATION 'Empresa Alob'")
print("=" * 60)

try:
    org_data = {
        "id": ORG_ID,
        "name": "Empresa Alob",
        "slug": "empresa-alob",
        "working_capital": 0,
        "emergency_reserve": 0,
        "capital_marketing": 0,
        "gross_investment": 0
    }
    
    result = supabase.table("organizations").upsert(org_data).execute()
    
    if result.data:
        print(f"✅ Organization criada/atualizada:")
        print(f"   ID: {result.data[0]['id']}")
        print(f"   Nome: {result.data[0]['name']}")
        print(f"   Slug: {result.data[0]['slug']}")
    else:
        print("⚠️  Organization pode já existir")
        
except Exception as e:
    print(f"❌ Erro ao criar organization: {e}")

# 2. Inserir pedidos de teste
print("\n" + "=" * 60)
print("2. INSERINDO PEDIDOS DE TESTE")
print("=" * 60)

pedidos = [
    {"num": 1001, "state": "SP", "city": "São Paulo", "amount": 150.00},
    {"num": 1002, "state": "RJ", "city": "Rio de Janeiro", "amount": 200.00},
    {"num": 1003, "state": "MG", "city": "Belo Horizonte", "amount": 180.00},
    {"num": 1004, "state": "SP", "city": "Campinas", "amount": 220.00},
    {"num": 1005, "state": "RS", "city": "Porto Alegre", "amount": 190.00},
    {"num": 1006, "state": "PR", "city": "Curitiba", "amount": 170.00},
    {"num": 1007, "state": "BA", "city": "Salvador", "amount": 160.00},
    {"num": 1008, "state": "SC", "city": "Florianópolis", "amount": 175.00},
]

pedidos_inseridos = 0
pedidos_existentes = 0

for pedido in pedidos:
    try:
        order_data = {
            "bling_order_id": 999000 + pedido["num"],
            "organization_id": ORG_ID,
            "order_number": pedido["num"],
            "bling_store_id": 205833031,
            "order_date": date.today().isoformat(),
            "total_products": 100.00,
            "total_amount": pedido["amount"],
            "status_id": 1,
            "status_value": pedido["amount"],
            "contact_name": f"Cliente {pedido['state']}",
            "label_state": pedido["state"],
            "label_city": pedido["city"],
            "label_zip": "01000-000",
            "label_neighborhood": "Centro",
            "sync_status": "synced"
        }
        
        result = supabase.table("bling_orders").insert(order_data).execute()
        
        if result.data:
            print(f"✅ Pedido {pedido['num']} - {pedido['city']}/{pedido['state']}")
            pedidos_inseridos += 1
        else:
            print(f"⚠️  Pedido {pedido['num']} pode já existir")
            pedidos_existentes += 1
            
    except Exception as e:
        error_msg = str(e)
        if "duplicate key" in error_msg or "already exists" in error_msg:
            print(f"⚠️  Pedido {pedido['num']} já existe")
            pedidos_existentes += 1
        else:
            print(f"❌ Erro no pedido {pedido['num']}: {e}")

print(f"\n📊 Resumo:")
print(f"   Inseridos: {pedidos_inseridos}")
print(f"   Já existiam: {pedidos_existentes}")

# 3. Verificar pedidos criados
print("\n" + "=" * 60)
print("3. VERIFICANDO PEDIDOS CRIADOS")
print("=" * 60)

try:
    result = supabase.table("bling_orders") \
        .select("order_number, label_state, label_city, total_amount") \
        .eq("organization_id", ORG_ID) \
        .order("order_number") \
        .execute()
    
    if result.data:
        print(f"✅ {len(result.data)} pedidos encontrados:\n")
        for order in result.data:
            print(f"   #{order['order_number']}: {order['label_city']}/{order['label_state']} - R$ {order['total_amount']}")
    else:
        print("❌ Nenhum pedido encontrado")
        
except Exception as e:
    print(f"❌ Erro ao verificar pedidos: {e}")

# 4. Contar por estado
print("\n" + "=" * 60)
print("4. DISTRIBUIÇÃO POR ESTADO")
print("=" * 60)

try:
    result = supabase.table("bling_orders") \
        .select("label_state") \
        .eq("organization_id", ORG_ID) \
        .execute()
    
    if result.data:
        states = {}
        for order in result.data:
            state = order['label_state']
            states[state] = states.get(state, 0) + 1
        
        total = len(result.data)
        print(f"✅ Total de pedidos: {total}\n")
        
        for state, count in sorted(states.items(), key=lambda x: x[1], reverse=True):
            percentage = (count / total) * 100
            print(f"   {state}: {count} pedidos ({percentage:.1f}%)")
    else:
        print("❌ Nenhum pedido encontrado")
        
except Exception as e:
    print(f"❌ Erro ao contar por estado: {e}")

print("\n" + "=" * 60)
print("✅ SETUP CONCLUÍDO!")
print("=" * 60)
print("\n📝 Próximos passos:")
print("   1. Fazer logout/login na aplicação")
print("   2. Abrir http://localhost:5173/sales")
print("   3. O mapa deve aparecer com os estados!")
