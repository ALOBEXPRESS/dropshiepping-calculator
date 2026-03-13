#!/usr/bin/env python3
"""
Verificar qual organization_id está associado ao usuário logado
"""

from supabase import create_client

SUPABASE_URL = "https://oensqhjnxwpcuanozske.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9lbnNxaGpueHdwY3Vhbm96c2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0MTMyNzIsImV4cCI6MjA4MTk4OTI3Mn0.msBzSx-6KOSLP3YLALIy7vPM17fT1PV9uv8zJ_8LRZA"

USER_EMAIL = "empresaalob@gmail.com"
OLD_ORG_ID = "e3274f4d-2627-4121-895d-b0e3a70b0ace"
NEW_ORG_ID = "28b4b443-03fd-4a2d-b596-9dcaf142b389"

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🔍 Verificando usuário e organization...\n")

# 1. Buscar usuário na tabela auth.users (via profiles ou user_organizations)
print("=" * 60)
print("1. BUSCANDO USUÁRIO")
print("=" * 60)

# Tentar buscar em profiles
try:
    result = supabase.table("profiles").select("*").eq("email", USER_EMAIL).execute()
    if result.data:
        print(f"✅ Usuário encontrado em profiles:")
        for profile in result.data:
            print(f"   - ID: {profile.get('id')}")
            print(f"   - Email: {profile.get('email')}")
            print(f"   - Name: {profile.get('full_name') or profile.get('name')}")
    else:
        print("❌ Usuário não encontrado em profiles")
except Exception as e:
    print(f"⚠️  Erro ao buscar em profiles: {e}")

# 2. Buscar em user_organizations
print("\n" + "=" * 60)
print("2. BUSCANDO ORGANIZATIONS DO USUÁRIO")
print("=" * 60)

try:
    # Primeiro pegar o user_id
    result = supabase.table("profiles").select("id").eq("email", USER_EMAIL).execute()
    
    if result.data:
        user_id = result.data[0]['id']
        print(f"User ID: {user_id}\n")
        
        # Buscar organizations
        result = supabase.table("user_organizations").select("*").eq("user_id", user_id).execute()
        
        if result.data:
            print(f"✅ {len(result.data)} organization(s) encontrada(s):")
            for uo in result.data:
                org_id = uo.get('organization_id')
                print(f"\n   Organization ID: {org_id}")
                print(f"   Role: {uo.get('role')}")
                print(f"   Created: {uo.get('created_at')}")
                
                # Verificar qual é
                if org_id == OLD_ORG_ID:
                    print(f"   ⚠️  Este é o ID ERRADO (antigo)")
                elif org_id == NEW_ORG_ID:
                    print(f"   ✅ Este é o ID CORRETO (novo)")
                else:
                    print(f"   ❓ ID desconhecido")
                
                # Buscar detalhes da organization
                org_result = supabase.table("organizations").select("*").eq("id", org_id).execute()
                if org_result.data:
                    org = org_result.data[0]
                    print(f"   Nome: {org.get('name')}")
                    print(f"   Slug: {org.get('slug')}")
        else:
            print("❌ Nenhuma organization encontrada para este usuário")
    else:
        print("❌ Usuário não encontrado")
        
except Exception as e:
    print(f"❌ Erro: {e}")

# 3. Listar TODAS as organizations
print("\n" + "=" * 60)
print("3. TODAS AS ORGANIZATIONS NO BANCO")
print("=" * 60)

try:
    result = supabase.table("organizations").select("*").execute()
    
    if result.data:
        print(f"✅ {len(result.data)} organization(s) encontrada(s):\n")
        for org in result.data:
            org_id = org.get('id')
            print(f"   ID: {org_id}")
            print(f"   Nome: {org.get('name')}")
            print(f"   Slug: {org.get('slug')}")
            
            if org_id == OLD_ORG_ID:
                print(f"   ⚠️  ID ERRADO (antigo)")
            elif org_id == NEW_ORG_ID:
                print(f"   ✅ ID CORRETO (novo)")
            
            print()
    else:
        print("❌ Nenhuma organization encontrada")
        
except Exception as e:
    print(f"❌ Erro: {e}")

# 4. Verificar se há dados em cada organization
print("=" * 60)
print("4. DADOS POR ORGANIZATION")
print("=" * 60)

for org_id, label in [(OLD_ORG_ID, "ANTIGA"), (NEW_ORG_ID, "NOVA")]:
    print(f"\n{label} ({org_id}):")
    
    # Contar bling_orders
    result = supabase.table("bling_orders").select("id", count="exact").eq("organization_id", org_id).execute()
    print(f"   - bling_orders: {result.count or 0}")
    
    # Contar orders
    result = supabase.table("orders").select("id", count="exact").eq("organization_id", org_id).execute()
    print(f"   - orders: {result.count or 0}")
    
    # Contar leads
    result = supabase.table("leads").select("id", count="exact").eq("organization_id", org_id).execute()
    print(f"   - leads: {result.count or 0}")

print("\n" + "=" * 60)
print("CONCLUSÃO")
print("=" * 60)
print(f"\nSeu usuário ({USER_EMAIL}) está associado a qual organization?")
print("Verifique a seção 2 acima para ver o organization_id correto.")
