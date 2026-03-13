import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface StateMetrics {
  state_code: string;
  state_name: string;
  order_count: number;
  total_revenue: number;
  total_profit: number;
  avg_margin: number;
  percentage: number;
}

interface CityMetrics {
  city_name: string;
  state_code: string;
  order_count: number;
  total_revenue: number;
  total_profit: number;
}

export function useGeographicSales(organizationId: string) {
  const [stateData, setStateData] = useState<StateMetrics[]>([]);
  const [cityData, setCityData] = useState<CityMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        
        // Fetch orders with location data
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders_with_location')
          .select('label_state, label_city, total_amount, total_profit, profit_margin')
          .eq('organization_id', organizationId)
          .not('label_state', 'is', null);

        if (ordersError) throw ordersError;

        // State names mapping
        const stateNames: Record<string, string> = {
          AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas',
          BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
          GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
          MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
          PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
          RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
          SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
        };

        // Group by state
        interface StateGroup {
          state_code: string;
          state_name: string;
          order_count: number;
          total_revenue: number;
          total_profit: number;
          margin_sum: number;
        }

        const stateGroups = ordersData.reduce((acc, order) => {
          const state = order.label_state?.toUpperCase();
          if (state && state.length === 2) {
            if (!acc[state]) {
              acc[state] = {
                state_code: state,
                state_name: stateNames[state] || state,
                order_count: 0,
                total_revenue: 0,
                total_profit: 0,
                margin_sum: 0
              };
            }
            acc[state].order_count += 1;
            acc[state].total_revenue += order.total_amount || 0;
            acc[state].total_profit += order.total_profit || 0;
            acc[state].margin_sum += order.profit_margin || 0;
          }
          return acc;
        }, {} as Record<string, StateGroup>);

        const totalOrders = ordersData.length;

        // Calculate percentages and averages
        const states = Object.values(stateGroups).map((state: StateGroup) => ({
          state_code: state.state_code,
          state_name: state.state_name,
          order_count: state.order_count,
          total_revenue: state.total_revenue,
          total_profit: state.total_profit,
          avg_margin: state.order_count > 0 ? state.margin_sum / state.order_count : 0,
          percentage: totalOrders > 0 ? (state.order_count / totalOrders) * 100 : 0
        })).sort((a, b) => b.total_revenue - a.total_revenue);

        setStateData(states);

        // Group by city
        interface CityGroup {
          city_name: string;
          state_code: string;
          order_count: number;
          total_revenue: number;
          total_profit: number;
        }

        const cityGroups = ordersData.reduce((acc, order) => {
          const city = order.label_city;
          const state = order.label_state?.toUpperCase();
          if (city && state) {
            const key = `${city}-${state}`;
            if (!acc[key]) {
              acc[key] = {
                city_name: city,
                state_code: state,
                order_count: 0,
                total_revenue: 0,
                total_profit: 0
              };
            }
            acc[key].order_count += 1;
            acc[key].total_revenue += order.total_amount || 0;
            acc[key].total_profit += order.total_profit || 0;
          }
          return acc;
        }, {} as Record<string, CityGroup>);

        const cities = Object.values(cityGroups)
          .sort((a, b) => b.total_revenue - a.total_revenue)
          .slice(0, 10); // Top 10 cities

        setCityData(cities);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    if (organizationId) {
      fetchData();
    }
  }, [organizationId]);

  return { stateData, cityData, loading, error };
}
