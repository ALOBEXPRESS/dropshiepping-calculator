import { supabase } from '@/lib/supabase';
import type { InfraGraphResponse } from '@/types/infraGraph';

/**
 * Fetches the full infrastructure graph for an organization via the
 * get_infra_graph RPC. Returns nodes and edges with no sensitive data
 * (proxy credentials stripped, host masked, document_number omitted).
 */
export async function getInfraGraph(
  organizationId: string
): Promise<InfraGraphResponse> {
  const { data, error } = await supabase.rpc('get_infra_graph', {
    p_organization_id: organizationId,
  });

  if (error) {
    throw new Error(`Erro ao carregar grafo de infraestrutura: ${error.message}`);
  }

  if (!data) {
    return { nodes: [], edges: [] };
  }

  // The RPC returns a JSONB object with {nodes, edges}
  const raw = data as Record<string, unknown>;

  return {
    nodes: Array.isArray(raw.nodes) ? (raw.nodes as InfraGraphResponse['nodes']) : [],
    edges: Array.isArray(raw.edges) ? (raw.edges as InfraGraphResponse['edges']) : [],
  };
}
