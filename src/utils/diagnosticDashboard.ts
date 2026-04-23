/**
 * Dashboard Diagnostic Utility
 * 
 * Script para diagnosticar problemas com dados zerados no dashboard.
 * Verifica:
 * - Estrutura da tabela orders
 * - Dados existentes
 * - organization_id do usuário
 * - Formato das datas
 */

import { supabase } from '../lib/supabase';

export async function runDashboardDiagnostic() {
  console.log('=== DASHBOARD DIAGNOSTIC START ===\n');

  try {
    // 1. Verificar autenticação
    console.log('1. Checking authentication...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ User not authenticated:', userError);
      return;
    }
    
    console.log('✅ User authenticated');
    console.log('   User ID:', user.id);
    console.log('   Email:', user.email);
    console.log('');

    // 2. Verificar se a tabela orders existe e tem dados
    console.log('2. Checking orders table...');
    const { data: allOrders, error: ordersError, count } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .limit(5);

    if (ordersError) {
      console.error('❌ Error querying orders table:', ordersError);
      return;
    }

    console.log(`✅ Orders table exists with ${count} total records`);
    
    if (allOrders && allOrders.length > 0) {
      console.log('   Sample order structure:');
      console.log('   ', JSON.stringify(allOrders[0], null, 2));
    } else {
      console.log('⚠️  No orders found in the table');
    }
    console.log('');

    // 3. Verificar orders com organization_id do usuário
    console.log('3. Checking orders for current user organization...');
    const { data: userOrders, error: userOrdersError, count: userCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .eq('organization_id', user.id)
      .limit(5);

    if (userOrdersError) {
      console.error('❌ Error querying user orders:', userOrdersError);
      return;
    }

    console.log(`   Found ${userCount} orders for organization_id: ${user.id}`);
    
    if (userOrders && userOrders.length > 0) {
      console.log('   Sample user order:');
      console.log('   ', JSON.stringify(userOrders[0], null, 2));
    } else {
      console.log('⚠️  No orders found for this organization_id');
      console.log('   This is likely why KPIs are showing zero!');
    }
    console.log('');

    // 4. Verificar todas as organization_ids únicas
    console.log('4. Checking all unique organization_ids in orders...');
    const { data: orgIds, error: orgError } = await supabase
      .from('orders')
      .select('organization_id')
      .limit(1000);

    if (orgError) {
      console.error('❌ Error querying organization_ids:', orgError);
    } else if (orgIds) {
      const uniqueOrgIds = [...new Set(orgIds.map(o => o.organization_id))];
      console.log(`   Found ${uniqueOrgIds.length} unique organization_id(s):`);
      uniqueOrgIds.forEach(id => {
        console.log(`   - ${id}${id === user.id ? ' (CURRENT USER)' : ''}`);
      });
    }
    console.log('');

    // 5. Verificar formato das datas
    console.log('5. Checking date formats...');
    const { data: datesSample, error: datesError } = await supabase
      .from('orders')
      .select('order_date, created_at')
      .limit(5);

    if (datesError) {
      console.error('❌ Error querying dates:', datesError);
    } else if (datesSample && datesSample.length > 0) {
      console.log('   Sample dates:');
      datesSample.forEach((row, i) => {
        console.log(`   [${i}] order_date: ${row.order_date}, created_at: ${row.created_at}`);
      });
    }
    console.log('');

    // 6. Verificar dados de lucro
    console.log('6. Checking profit data...');
    const { data: profitSample, error: profitError } = await supabase
      .from('orders')
      .select('total_profit, order_date')
      .not('total_profit', 'is', null)
      .limit(5);

    if (profitError) {
      console.error('❌ Error querying profit:', profitError);
    } else if (profitSample && profitSample.length > 0) {
      console.log(`   Found ${profitSample.length} orders with profit data:`);
      profitSample.forEach((row, i) => {
        console.log(`   [${i}] profit: ${row.total_profit}, date: ${row.order_date}`);
      });
      
      const totalProfit = profitSample.reduce((sum, row) => sum + (row.total_profit || 0), 0);
      console.log(`   Total profit from sample: ${totalProfit}`);
    } else {
      console.log('⚠️  No orders with profit data found');
    }
    console.log('');

    // 7. Testar query com filtro de data (última semana)
    console.log('7. Testing date range query (last 7 days)...');
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: recentOrders, error: recentError, count: recentCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact' })
      .gte('order_date', weekAgo.toISOString())
      .lte('order_date', now.toISOString())
      .limit(5);

    if (recentError) {
      console.error('❌ Error querying recent orders:', recentError);
    } else {
      console.log(`   Found ${recentCount} orders in the last 7 days`);
      if (recentOrders && recentOrders.length > 0) {
        console.log('   Sample recent order:');
        console.log('   ', JSON.stringify(recentOrders[0], null, 2));
      }
    }
    console.log('');

    // 8. Resumo e recomendações
    console.log('=== DIAGNOSTIC SUMMARY ===');
    console.log('');
    
    if (userCount === 0 && count && count > 0) {
      console.log('🔍 ISSUE FOUND:');
      console.log('   The orders table has data, but none match your organization_id.');
      console.log('   ');
      console.log('   Possible solutions:');
      console.log('   1. Update existing orders to use your organization_id');
      console.log('   2. Create new orders with your organization_id');
      console.log('   3. Check if organization_id should come from a different source');
    } else if (count === 0) {
      console.log('🔍 ISSUE FOUND:');
      console.log('   The orders table is empty. You need to add some orders first.');
    } else if (userCount && userCount > 0) {
      console.log('✅ Data looks good!');
      console.log('   If KPIs are still showing zero, check:');
      console.log('   1. Date range filters (are orders within the selected period?)');
      console.log('   2. Column names (total_profit vs profit, order_date vs created_at)');
    }

  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }

  console.log('\n=== DASHBOARD DIAGNOSTIC END ===');
}

// Função auxiliar para executar no console do navegador
(window as any).runDashboardDiagnostic = runDashboardDiagnostic;
