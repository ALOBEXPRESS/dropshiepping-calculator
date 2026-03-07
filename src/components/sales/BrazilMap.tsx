import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';

interface BrazilMapProps {
  organizationId: string;
}

interface StateData {
  state_code: string;
  state_name: string;
  order_count: number;
  percentage: number;
}

// Mapa de códigos de estado para nomes completos
const stateNames: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas',
  BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo',
  GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná',
  PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina',
  SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins',
};

// URLs das bandeiras dos estados (GitHub)
const getStateFlagUrl = (stateCode: string) => {
  return `https://raw.githubusercontent.com/mateusKoppe/brazilian-states-flags/master/flags/${stateCode.toLowerCase()}.svg`;
};

// TopoJSON do Brasil (simplificado)
const BRAZIL_TOPO_JSON = 'https://raw.githubusercontent.com/deldersveld/topojson/master/countries/brazil/brazil-states.json';

export const BrazilMap: React.FC<BrazilMapProps> = ({ organizationId }) => {
  const [data, setData] = useState<StateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) return;

      setLoading(true);
      setError(null);

      try {
        const { data: statesData, error: fetchError } = await supabase
          .from('bling_orders')
          .select('label_state')
          .eq('organization_id', organizationId)
          .not('label_state', 'is', null);

        if (fetchError) throw fetchError;

        // Contar pedidos por estado
        const stateCounts = new Map<string, number>();
        statesData?.forEach((order) => {
          const state = order.label_state?.toUpperCase();
          if (state && state.length === 2) {
            stateCounts.set(state, (stateCounts.get(state) || 0) + 1);
          }
        });

        const totalOrders = statesData?.length || 0;

        // Converter para array
        const formattedData: StateData[] = Array.from(stateCounts.entries()).map(
          ([code, count]) => ({
            state_code: code,
            state_name: stateNames[code] || code,
            order_count: count,
            percentage: totalOrders > 0 ? (count / totalOrders) * 100 : 0,
          })
        );

        // Ordenar por quantidade
        formattedData.sort((a, b) => b.order_count - a.order_count);

        setData(formattedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        console.error('Error fetching Brazil map data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organizationId]);

  const getStateColor = (stateCode: string) => {
    const stateData = data.find((d) => d.state_code === stateCode);
    if (!stateData) return '#e5e7eb';

    const percentage = stateData.percentage;
    if (percentage >= 50) return '#10B981'; // Verde
    if (percentage >= 30) return '#3B82F6'; // Azul
    if (percentage >= 15) return '#F59E0B'; // Laranja
    return '#EF4444'; // Vermelho
  };

  const getStateInfo = (stateCode: string) => {
    return data.find((d) => d.state_code === stateCode);
  };

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

  const selectedStateData = selectedState ? getStateInfo(selectedState) : null;

  return (
    <Card className="p-6 border-gray-100 dark:border-zinc-800">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Mapa de Vendas por Estado
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Clique em um estado para ver detalhes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mapa */}
        <div className="relative">
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
              {({ geographies }: { geographies: Array<{ rsmKey: string; properties: { sigla?: string; SIGLA?: string } }> }) =>
                geographies.map((geo) => {
                  const stateCode = geo.properties.sigla || geo.properties.SIGLA;
                  if (!stateCode) return null;
                  const isSelected = selectedState === stateCode;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getStateColor(stateCode)}
                      stroke="#fff"
                      strokeWidth={isSelected ? 2 : 0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: {
                          fill: '#4F46E5',
                          outline: 'none',
                          cursor: 'pointer',
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
            <div className="absolute top-4 left-4 bg-white dark:bg-zinc-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {stateNames[hoveredState] || hoveredState}
              </p>
              {getStateInfo(hoveredState) && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getStateInfo(hoveredState)?.order_count} pedidos (
                  {getStateInfo(hoveredState)?.percentage.toFixed(1)}%)
                </p>
              )}
            </div>
          )}
        </div>

        {/* Detalhes do Estado Selecionado */}
        <div>
          {selectedStateData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img
                  src={getStateFlagUrl(selectedStateData.state_code)}
                  alt={`Bandeira ${selectedStateData.state_name}`}
                  className="w-20 h-14 object-cover rounded border border-gray-200 dark:border-zinc-700"
                  onError={(e) => {
                    // Fallback para emoji se a bandeira não carregar
                    e.currentTarget.style.display = 'none';
                  }}
                />
                <div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedStateData.state_name}
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
                    {selectedStateData.order_count}
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
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🗺️</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Clique em um estado no mapa para ver detalhes
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-800">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Legenda:</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">≥ 50%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">30-49%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">15-29%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-xs text-gray-600 dark:text-gray-400">{'< 15%'}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
