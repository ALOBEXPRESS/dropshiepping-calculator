/**
 * Gender Classification Service
 * 
 * Serviço responsável por classificar o gênero de leads e clientes
 * utilizando a API Genderize.io
 */

export type Gender = 'male' | 'female' | null;

export interface GenderizeResponse {
  name: string;
  gender: Gender;
  probability: number | null;
  count: number;
}

export interface ClassificationResult {
  recordId: string;
  gender: Gender;
  gender_probability: number | null;
}

export interface ClassificationSummary {
  total: number;
  classified: number;
  unclassified: number;
  errors: number;
}

export interface GenderClassifierConfig {
  apiKey?: string;           // VITE_GENDERIZE_API_KEY (opcional)
  threshold?: number;        // VITE_GENDER_PROBABILITY_THRESHOLD (padrão: 0.80)
  countryFallbackMinCount?: number; // mínimo de count para aceitar resultado localizado (padrão: 10)
}

/**
 * Extrai o primeiro nome de um nome completo
 * 
 * Divide o nome por espaço e retorna o primeiro token.
 * 
 * @param fullName - Nome completo (ex: "João Silva")
 * @returns Primeiro nome (ex: "João")
 * 
 * @example
 * extractFirstName("João Silva") // "João"
 * extractFirstName("Maria") // "Maria"
 * extractFirstName("") // ""
 * 
 * **Validates: Requirements 2.1**
 */
export function extractFirstName(fullName: string): string {
  if (!fullName || fullName.trim() === '') {
    return '';
  }
  
  const tokens = fullName.trim().split(/\s+/);
  return tokens[0];
}

/**
 * Constrói a URL para requisição em lote à API Genderize.io
 * 
 * Formato: name[]=n1&name[]=n2&...
 * Adiciona apikey e country_id quando presentes.
 * 
 * @param names - Array de nomes (até 10)
 * @param apiKey - API key opcional
 * @param countryId - Código do país ISO 3166-1 alpha-2 (ex: "BR")
 * @returns URL completa com query string
 * 
 * @example
 * buildBatchUrl(["João", "Maria"]) 
 * // "https://api.genderize.io?name[]=João&name[]=Maria"
 * 
 * buildBatchUrl(["João"], "abc123", "BR")
 * // "https://api.genderize.io?name[]=João&apikey=abc123&country_id=BR"
 * 
 * **Validates: Requirements 2.2, 2.3, 3.2**
 */
export function buildBatchUrl(
  names: string[], 
  apiKey?: string, 
  countryId?: string
): string {
  const baseUrl = 'https://api.genderize.io';
  const params = new URLSearchParams();
  
  // Adicionar nomes no formato name[]=valor
  names.forEach(name => {
    params.append('name[]', name);
  });
  
  // Adicionar apikey se configurado
  if (apiKey) {
    params.append('apikey', apiKey);
  }
  
  // Adicionar country_id se presente
  if (countryId) {
    params.append('country_id', countryId);
  }
  
  return `${baseUrl}?${params.toString()}`;
}

/**
 * Aplica o threshold de probabilidade à resposta da API
 * 
 * Se probability < threshold ou gender === null, retorna gender=null.
 * Se probability >= threshold e gender não-nulo, preserva o gênero.
 * Sempre armazena o valor de probability retornado pela API.
 * 
 * @param response - Resposta da API Genderize.io
 * @param threshold - Limiar mínimo de probabilidade (0.0-1.0)
 * @returns Resultado da classificação com gender e gender_probability
 * 
 * @example
 * applyThreshold({ name: "João", gender: "male", probability: 0.98, count: 100 }, 0.80)
 * // { gender: "male", gender_probability: 0.98 }
 * 
 * applyThreshold({ name: "Alex", gender: "male", probability: 0.72, count: 50 }, 0.80)
 * // { gender: null, gender_probability: 0.72 }
 * 
 * applyThreshold({ name: "Unknown", gender: null, probability: null, count: 0 }, 0.80)
 * // { gender: null, gender_probability: null }
 * 
 * **Validates: Requirements 2.6, 2.7, 6.2, 6.4**
 */
export function applyThreshold(
  response: GenderizeResponse, 
  threshold: number
): Omit<ClassificationResult, 'recordId'> {
  // Se a API retornou gender null, ambos os campos são null
  if (response.gender === null) {
    return {
      gender: null,
      gender_probability: response.probability
    };
  }
  
  // Se probability é null, não podemos aplicar threshold
  if (response.probability === null) {
    return {
      gender: null,
      gender_probability: null
    };
  }
  
  // Se probability < threshold, gender é null mas preservamos probability
  if (response.probability < threshold) {
    return {
      gender: null,
      gender_probability: response.probability
    };
  }
  
  // Se probability >= threshold, preservamos o gender e probability
  return {
    gender: response.gender,
    gender_probability: response.probability
  };
}

/**
 * Lê e valida o threshold de probabilidade da configuração
 * 
 * Lê VITE_GENDER_PROBABILITY_THRESHOLD do ambiente.
 * Se o valor estiver fora de [0.0, 1.0], usa 0.80 e loga warning.
 * 
 * @returns Threshold validado (padrão: 0.80)
 * 
 * **Validates: Requirements 6.1, 6.3**
 */
export function getValidatedThreshold(): number {
  const DEFAULT_THRESHOLD = 0.80;
  const envValue = import.meta.env.VITE_GENDER_PROBABILITY_THRESHOLD;
  
  if (!envValue) {
    return DEFAULT_THRESHOLD;
  }
  
  const parsed = parseFloat(envValue);
  
  if (isNaN(parsed) || parsed < 0.0 || parsed > 1.0) {
    console.warn(
      `[GenderClassifier] VITE_GENDER_PROBABILITY_THRESHOLD inválido: "${envValue}". ` +
      `Deve estar entre 0.0 e 1.0. Usando valor padrão: ${DEFAULT_THRESHOLD}`
    );
    return DEFAULT_THRESHOLD;
  }
  
  return parsed;
}

/**
 * Aguarda um número específico de segundos
 * 
 * @param seconds - Número de segundos para aguardar
 */
async function sleep(seconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

/**
 * Classifica um lote de nomes usando a API Genderize.io
 * 
 * Faz requisição HTTP para https://api.genderize.io com array de nomes (até 10).
 * Trata erros HTTP:
 * - 401/402 → halt (lança erro)
 * - 422 → skip + log (retorna resultados parciais)
 * - 429 → aguarda X-Rate-Limit-Reset
 * - Erro de rede → retry 3x com backoff exponencial (1s, 2s, 4s)
 * 
 * Loga headers de rate limit e emite warning quando X-Rate-Limit-Remaining < 10.
 * Inclui country_id quando disponível; retry sem country_id se count < 10.
 * 
 * @param names - Array de nomes (até 10)
 * @param config - Configuração do classificador
 * @param countryId - Código do país ISO 3166-1 alpha-2 (opcional)
 * @returns Array de respostas da API Genderize.io
 * @throws Error quando 401/402 ou após 3 tentativas de rede falharem
 * 
 * @example
 * const results = await classifyBatch(["João", "Maria"], { apiKey: "abc123" }, "BR");
 * // [
 * //   { name: "João", gender: "male", probability: 0.98, count: 4521 },
 * //   { name: "Maria", gender: "female", probability: 0.99, count: 8832 }
 * // ]
 * 
 * **Validates: Requirements 2.4, 2.5, 2.8, 2.9, 2.10, 2.11, 3.2, 3.4, 3.5, 7.1, 7.2, 7.3, 10.1, 10.2, 10.3**
 */
export async function classifyBatch(
  names: string[],
  config: GenderClassifierConfig,
  countryId?: string
): Promise<GenderizeResponse[]> {
  const MAX_RETRIES = 3;
  const BACKOFF_DELAYS = [1, 2, 4]; // segundos
  const MIN_COUNT_THRESHOLD = config.countryFallbackMinCount ?? 10;
  
  let lastError: Error | null = null;
  let attempt = 0;
  let useCountryId = countryId;
  
  while (attempt < MAX_RETRIES) {
    try {
      const url = buildBatchUrl(names, config.apiKey, useCountryId);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      // Logar headers de rate limit (Req 10.1)
      const rateLimitLimit = response.headers.get('X-Rate-Limit-Limit');
      const rateLimitRemaining = response.headers.get('X-Rate-Limit-Remaining');
      const rateLimitReset = response.headers.get('X-Rate-Limit-Reset');
      
      if (rateLimitLimit || rateLimitRemaining || rateLimitReset) {
        console.log(
          `[GenderClassifier] Rate Limit Status: ` +
          `Limit=${rateLimitLimit}, Remaining=${rateLimitRemaining}, Reset=${rateLimitReset}s`
        );
      }
      
      // Emitir warning quando quota baixa (Req 10.2)
      if (rateLimitRemaining && parseInt(rateLimitRemaining) < 10) {
        console.warn(
          `[GenderClassifier] ⚠️ Quota baixa! Apenas ${rateLimitRemaining} requisições restantes. ` +
          `Quota reseta em ${rateLimitReset}s.`
        );
      }
      
      // Tratar 401/402 → halt (Req 2.9)
      if (response.status === 401 || response.status === 402) {
        const errorBody = await response.text();
        const errorMessage = `[GenderClassifier] Erro de autenticação/pagamento (${response.status}): ${errorBody}`;
        console.error(errorMessage);
        throw new Error(errorMessage);
      }
      
      // Tratar 422 → skip + log (Req 2.10)
      if (response.status === 422) {
        const errorBody = await response.text();
        console.warn(
          `[GenderClassifier] Nome(s) inválido(s) (422): ${errorBody}. ` +
          `Nomes: ${names.join(', ')}. Pulando este lote.`
        );
        // Retornar resultados vazios para este lote (serão marcados como não classificados)
        return names.map(name => ({
          name,
          gender: null,
          probability: null,
          count: 0
        }));
      }
      
      // Tratar 429 → aguardar X-Rate-Limit-Reset (Req 2.8, 3.5)
      if (response.status === 429) {
        const resetSeconds = rateLimitReset ? parseInt(rateLimitReset) : 60;
        console.warn(
          `[GenderClassifier] Rate limit excedido (429). ` +
          `Aguardando ${resetSeconds}s até o reset da quota...`
        );
        await sleep(resetSeconds);
        // Não incrementar attempt — retry imediato após aguardar
        continue;
      }
      
      // Verificar se resposta é OK
      if (!response.ok) {
        throw new Error(
          `[GenderClassifier] Erro HTTP ${response.status}: ${await response.text()}`
        );
      }
      
      // Parse da resposta
      const data: GenderizeResponse[] = await response.json();
      
      // Verificar se precisa fazer fallback sem country_id (Req 7.2)
      if (useCountryId && data.length > 0) {
        const needsFallback = data.some(result => result.count < MIN_COUNT_THRESHOLD);
        
        if (needsFallback) {
          console.log(
            `[GenderClassifier] Resultado localizado com count < ${MIN_COUNT_THRESHOLD}. ` +
            `Retrying sem country_id para obter previsão global...`
          );
          useCountryId = undefined;
          attempt = 0; // Reset attempt counter para o retry sem country_id
          continue;
        }
      }
      
      // Sucesso — retornar resultados
      return data;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Se for erro de autenticação/pagamento, não fazer retry
      if (lastError.message.includes('401') || lastError.message.includes('402')) {
        throw lastError;
      }
      
      attempt++;
      
      if (attempt < MAX_RETRIES) {
        const delay = BACKOFF_DELAYS[attempt - 1];
        console.warn(
          `[GenderClassifier] Erro de rede (tentativa ${attempt}/${MAX_RETRIES}): ${lastError.message}. ` +
          `Retrying em ${delay}s...`
        );
        await sleep(delay);
      }
    }
  }
  
  // Após 3 falhas, lançar erro (Req 2.11)
  const errorMessage = `[GenderClassifier] Falha após ${MAX_RETRIES} tentativas: ${lastError?.message}`;
  console.error(errorMessage);
  throw new Error(errorMessage);
}

/**
 * Classifica um único registro usando a API Genderize.io
 * 
 * Extrai o primeiro nome do nome completo, chama classifyBatch com array de 1 elemento,
 * e retorna o resultado da classificação.
 * 
 * @param recordId - ID do registro sendo classificado
 * @param fullName - Nome completo do registro (ex: "João Silva")
 * @param config - Configuração do classificador
 * @param countryId - Código do país ISO 3166-1 alpha-2 (opcional)
 * @returns Resultado da classificação com recordId, gender e gender_probability
 * @throws Error quando a API falha após retries ou retorna erro de autenticação
 * 
 * @example
 * const result = await classifySingle("lead-123", "João Silva", { apiKey: "abc123" }, "BR");
 * // { recordId: "lead-123", gender: "male", gender_probability: 0.98 }
 * 
 * const result = await classifySingle("lead-456", "Alex Santos", { threshold: 0.80 });
 * // { recordId: "lead-456", gender: null, gender_probability: 0.72 }
 * 
 * **Validates: Requirements 5.1, 5.2, 5.3**
 */
export async function classifySingle(
  recordId: string,
  fullName: string,
  config: GenderClassifierConfig,
  countryId?: string
): Promise<ClassificationResult> {
  // Extrair primeiro nome
  const firstName = extractFirstName(fullName);
  
  // Se o nome está vazio, retornar resultado não classificado
  if (!firstName) {
    return {
      recordId,
      gender: null,
      gender_probability: null
    };
  }
  
  // Obter threshold validado
  const threshold = config.threshold ?? getValidatedThreshold();
  
  // Chamar classifyBatch com array de 1 elemento
  const batchResults = await classifyBatch([firstName], config, countryId);
  
  // Pegar o primeiro (e único) resultado
  const apiResponse = batchResults[0];
  
  // Aplicar threshold
  const { gender, gender_probability } = applyThreshold(apiResponse, threshold);
  
  // Retornar resultado com recordId
  return {
    recordId,
    gender,
    gender_probability
  };
}

/**
 * Executa classificação em lote para todos os leads/customers sem gênero
 * 
 * Busca todos os registros com `gender IS NULL AND name IS NOT NULL` para o organization_id,
 * agrupa em batches de 10, chama classifyBatch, atualiza o banco de dados,
 * e retorna um sumário com total processado, classificado, não classificado e erros.
 * 
 * @param organizationId - ID da organização
 * @param config - Configuração do classificador
 * @param tableName - Nome da tabela ('leads' ou 'customers')
 * @returns Sumário da classificação com contagens
 * @throws Error quando a query inicial falha
 * 
 * @example
 * const summary = await runClassificationJob("org-123", { apiKey: "abc123" }, "leads");
 * // { total: 100, classified: 85, unclassified: 10, errors: 5 }
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**
 */
export async function runClassificationJob(
  organizationId: string,
  config: GenderClassifierConfig,
  tableName: 'leads' | 'customers' = 'leads'
): Promise<ClassificationSummary> {
  // Importar supabase client dinamicamente para evitar circular dependency
  const { supabase } = await import('../lib/supabase');
  
  const summary: ClassificationSummary = {
    total: 0,
    classified: 0,
    unclassified: 0,
    errors: 0
  };
  
  try {
    // Buscar todos os registros sem gênero (Req 4.1, 4.2)
    console.log(`[GenderClassifier] Buscando registros de ${tableName} sem gênero para org ${organizationId}...`);
    
    const { data: records, error: queryError } = await supabase
      .from(tableName)
      .select('id, name')
      .eq('organization_id', organizationId)
      .is('gender', null)
      .not('name', 'is', null);
    
    if (queryError) {
      const errorMessage = `[GenderClassifier] Erro ao buscar registros: ${queryError.message}`;
      console.error(errorMessage);
      throw new Error(errorMessage);
    }
    
    if (!records || records.length === 0) {
      console.log(`[GenderClassifier] Nenhum registro encontrado para classificação.`);
      return summary;
    }
    
    summary.total = records.length;
    console.log(`[GenderClassifier] ${summary.total} registros encontrados. Iniciando classificação...`);
    
    // Obter threshold validado
    const threshold = config.threshold ?? getValidatedThreshold();
    
    // Agrupar em batches de 10 (Req 4.5)
    const BATCH_SIZE = 10;
    const batches: typeof records[] = [];
    
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      batches.push(records.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`[GenderClassifier] Processando ${batches.length} batches de até ${BATCH_SIZE} registros...`);
    
    // Processar cada batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`[GenderClassifier] Processando batch ${batchIndex + 1}/${batches.length} (${batch.length} registros)...`);
      
      try {
        // Extrair primeiros nomes
        const firstNames = batch.map(record => extractFirstName(record.name));
        
        // Chamar API Genderize.io
        // Usar "BR" como país padrão para melhor precisão com nomes brasileiros
        const countryId = 'BR';
        const apiResults = await classifyBatch(firstNames, config, countryId);
        
        // Processar resultados e atualizar banco
        for (let i = 0; i < batch.length; i++) {
          const record = batch[i];
          const apiResponse = apiResults[i];
          
          if (!apiResponse) {
            console.warn(`[GenderClassifier] Sem resposta da API para registro ${record.id}`);
            summary.errors++;
            continue;
          }
          
          // Aplicar threshold
          const { gender, gender_probability } = applyThreshold(apiResponse, threshold);
          
          // Atualizar registro no banco (Req 4.3)
          const { error: updateError } = await supabase
            .from(tableName)
            .update({
              gender,
              gender_probability
            })
            .eq('id', record.id);
          
          if (updateError) {
            console.error(
              `[GenderClassifier] Erro ao atualizar registro ${record.id}: ${updateError.message}`
            );
            summary.errors++;
          } else {
            // Incrementar contadores
            if (gender !== null) {
              summary.classified++;
            } else {
              summary.unclassified++;
            }
          }
        }
        
      } catch (batchError) {
        // Erro ao processar batch inteiro
        const errorMessage = batchError instanceof Error ? batchError.message : String(batchError);
        console.error(
          `[GenderClassifier] Erro ao processar batch ${batchIndex + 1}: ${errorMessage}`
        );
        
        // Se for erro de autenticação/pagamento, interromper job
        if (errorMessage.includes('401') || errorMessage.includes('402')) {
          console.error(`[GenderClassifier] Erro de autenticação/pagamento. Interrompendo job.`);
          summary.errors += batch.length;
          break;
        }
        
        // Para outros erros, marcar todos os registros do batch como erro e continuar
        summary.errors += batch.length;
      }
    }
    
    // Retornar sumário (Req 4.4)
    console.log(
      `[GenderClassifier] Job concluído. ` +
      `Total: ${summary.total}, Classificados: ${summary.classified}, ` +
      `Não classificados: ${summary.unclassified}, Erros: ${summary.errors}`
    );
    
    return summary;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[GenderClassifier] Erro fatal no job: ${errorMessage}`);
    throw error;
  }
}
