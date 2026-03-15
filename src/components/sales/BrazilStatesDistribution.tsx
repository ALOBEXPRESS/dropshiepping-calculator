import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { supabase } from '@/lib/supabase';
import { Loader2, MapPin } from 'lucide-react';

interface BrazilStatesDistributionProps {
  organizationId: string;
  refreshTrigger?: number;
}

interface StateData {
  state: string;
  state_code: string;
  total_customers: number;
  percentage: number;
}

// Mapeamento de cores por região para as bandeiras
const regionColors: Record<string, { primary: string; secondary: string }> = {
  'Norte': { primary: 'from-green-500', secondary: 'to-green-600' },
  'Nordeste': { primary: 'from-yellow-500', secondary: 'to-orange-500' },
  'Centro-Oeste': { primary: 'from-blue-500', secondary: 'to-blue-600' },
  'Sudeste': { primary: 'from-purple-500', secondary: 'to-purple-600' },
  'Sul': { primary: 'from-red-500', secondary: 'to-red-600' },
};

const brazilianStates = [
  { code: 'AC', name: 'Acre', region: 'Norte' },
  { code: 'AL', name: 'Alagoas', region: 'Nordeste' },
  { code: 'AP', name: 'Amapá', region: 'Norte' },
  { code: 'AM', name: 'Amazonas', region: 'Norte' },
  { code: 'BA', name: 'Bahia', region: 'Nordeste' },
  { code: 'CE', name: 'Ceará', region: 'Nordeste' },
  { code: 'DF', name: 'Distrito Federal', region: 'Centro-Oeste' },
  { code: 'ES', name: 'Espírito Santo', region: 'Sudeste' },
  { code: 'GO', name: 'Goiás', region: 'Centro-Oeste' },
  { code: 'MA', name: 'Maranhão', region: 'Nordeste' },
  { code: 'MT', name: 'Mato Grosso', region: 'Centro-Oeste' },
  { code: 'MS', name: 'Mato Grosso do Sul', region: 'Centro-Oeste' },
  { code: 'MG', name: 'Minas Gerais', region: 'Sudeste' },
  { code: 'PA', name: 'Pará', region: 'Norte' },
  { code: 'PB', name: 'Paraíba', region: 'Nordeste' },
  { code: 'PR', name: 'Paraná', region: 'Sul' },
  { code: 'PE', name: 'Pernambuco', region: 'Nordeste' },
  { code: 'PI', name: 'Piauí', region: 'Nordeste' },
  { code: 'RJ', name: 'Rio de Janeiro', region: 'Sudeste' },
  { code: 'RN', name: 'Rio Grande do Norte', region: 'Nordeste' },
  { code: 'RS', name: 'Rio Grande do Sul', region: 'Sul' },
  { code: 'RO', name: 'Rondônia', region: 'Norte' },
  { code: 'RR', name: 'Roraima', region: 'Norte' },
  { code: 'SC', name: 'Santa Catarina', region: 'Sul' },
  { code: 'SP', name: 'São Paulo', region: 'Sudeste' },
  { code: 'SE', name: 'Sergipe', region: 'Nordeste' },
  { code: 'TO', name: 'Tocantins', region: 'Norte' },
];

// TopoJSON do Brasil
const BRAZIL_TOPO_JSON = 'https://gist.githubusercontent.com/ruliana/1ccaaab05ea113b0dff3b22be3b4d637/raw/br-states.json';

export const BrazilStatesDistribution: React.FC<BrazilStatesDistributionProps> = ({ organizationId, refreshTrigger }) => {
  const [statesData, setStatesData] = useState<StateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatesData = async () => {
      if (!organizationId) return;

      setLoading(true);
      setError(null);

      try {
        // Buscar pedidos com dados de estado da tabela bling_orders
        const { data: ordersData, error: fetchError } = await supabase
          .from('bling_orders')
          .select('label_state')
          .eq('organization_id', organizationId)
          .not('label_state', 'is', null);

        if (fetchError) throw fetchError;

        // Contar pedidos por estado
        const stateCounts: Record<string, number> = {};
        let totalOrders = 0;

        (ordersData || []).forEach((order: { label_state?: string }) => {
          const state = order.label_state?.toUpperCase().trim();
          if (state && state.length === 2) {
            stateCounts[state] = (stateCounts[state] || 0) + 1;
            totalOrders++;
          }
        });

        // Criar array de dados com percentuais
        const formattedData: StateData[] = Object.entries(stateCounts)
          .map(([code, count]) => {
            const stateInfo = brazilianStates.find(s => s.code === code);
            return {
              state: stateInfo?.name || code,
              state_code: code,
              total_customers: count,
              percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0,
            };
          })
          .sort((a, b) => b.total_customers - a.total_customers)
          .slice(0, 10); // Top 10 estados

        setStatesData(formattedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        console.error('Error fetching states data:', err);
      } finally {
        setLoading(false);
      }
    };

    // Só refetch se refreshTrigger for > 0 (ou seja, após processar pedido)
    if (!refreshTrigger || refreshTrigger === 0) {
      fetchStatesData();
    } else if (refreshTrigger > 0) {
      console.log('🔄 BrazilStatesDistribution: refreshTrigger mudou, refazendo query...', refreshTrigger);
      fetchStatesData();
    }
  }, [organizationId, refreshTrigger]);

  if (loading) {
    return (
      <Card className="p-6 border-gray-100 dark:border-zinc-800">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-gray-100 dark:border-zinc-800">
        <div className="text-center text-red-500 py-8">{error}</div>
      </Card>
    );
  }

  const getStateColor = (stateCode: string) => {
    const stateData = statesData.find((d) => d.state_code === stateCode);
    if (!stateData) return '#e5e7eb';

    const percentage = stateData.percentage;
    if (percentage >= 50) return '#10B981'; // Verde
    if (percentage >= 30) return '#3B82F6'; // Azul
    if (percentage >= 15) return '#F59E0B'; // Laranja
    return '#EF4444'; // Vermelho
  };

  const selectedStateData = selectedState ? statesData.find(s => s.state_code === selectedState) : null;

  return (
    <Card className="p-6 border-gray-100 dark:border-zinc-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Distribuição por Estado
        </h3>
        <MapPin className="w-5 h-5 text-gray-400" />
      </div>

      {statesData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mapa */}
          <div className="relative bg-gray-50 dark:bg-zinc-900 rounded-lg p-4">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 700,
                center: [-52, -15],
              }}
              width={400}
              height={400}
              className="w-full h-auto"
            >
              <Geographies geography={BRAZIL_TOPO_JSON}>
                {({ geographies }: { geographies: Array<{ rsmKey: string; id?: string; properties: { sigla?: string; SIGLA?: string; nome?: string } }> }) =>
                  geographies.map((geo) => {
                    const stateCode = geo.id || geo.properties.sigla || geo.properties.SIGLA;
                    if (!stateCode) return null;
                    const isSelected = selectedState === stateCode;
                    const fillColor = getStateColor(stateCode);

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={fillColor}
                        stroke="#ffffff"
                        strokeWidth={isSelected ? 2 : 0.5}
                        style={{
                          default: { outline: 'none' },
                          hover: {
                            fill: '#4F46E5',
                            outline: 'none',
                            cursor: 'pointer',
                            opacity: 0.8,
                          },
                          pressed: { outline: 'none' },
                        }}
                        onMouseEnter={() => setHoveredState(stateCode)}
                        onMouseLeave={() => setHoveredState(null)}
                        onClick={() => setSelectedState(stateCode)}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>

            {/* Tooltip */}
            {hoveredState && (
              <div className="absolute top-4 left-4 bg-white dark:bg-zinc-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 z-10">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {brazilianStates.find(s => s.code === hoveredState)?.name || hoveredState}
                </p>
                {statesData.find(s => s.state_code === hoveredState) && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {statesData.find(s => s.state_code === hoveredState)?.total_customers} pedidos (
                    {statesData.find(s => s.state_code === hoveredState)?.percentage.toFixed(1)}%)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Lista de Estados ou Detalhes */}
          <div>
            {selectedStateData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-14 rounded border border-gray-200 dark:border-zinc-700 overflow-hidden flex items-center justify-center bg-white dark:bg-zinc-800">
                    <img 
                      src={`/flags/br/${selectedStateData.state_code.toLowerCase()}.svg`} 
                      width={80} 
                      alt={`Bandeira ${selectedStateData.state}`}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                      {selectedStateData.state}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedStateData.state_code}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">
                      Total de Pedidos
                    </p>
                    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {selectedStateData.total_customers}
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <p className="text-xs text-green-600 dark:text-green-400 mb-1">
                      Percentual
                    </p>
                    <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {selectedStateData.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedState(null)}
                  className="w-full py-2 px-4 bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors text-sm"
                >
                  Limpar Seleção
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {statesData.map((state) => {
                  const stateInfo = brazilianStates.find(s => s.code === state.state_code);
                  const colors = stateInfo ? regionColors[stateInfo.region] : { primary: 'from-gray-500', secondary: 'to-gray-600' };
                  
                  return (
                    <div 
                      key={state.state_code} 
                      className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800/50 p-2 rounded-lg transition-colors"
                      onClick={() => setSelectedState(state.state_code)}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800">
                        <img 
                          src={`/flags/br/${state.state_code.toLowerCase()}.svg`} 
                          width={48} 
                          alt={`Bandeira ${state.state}`}
                          className="object-contain"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">
                            {state.state}
                          </p>
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {state.percentage.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${colors.primary} ${colors.secondary} transition-all duration-500`}
                              style={{ width: `${state.percentage}%` }}
                            />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {state.total_customers} {state.total_customers === 1 ? 'pedido' : 'pedidos'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum dado de localização disponível
          </p>
        </div>
      )}
    </Card>
  );
};
