import React, { useState } from 'react';
import {
  AlertTriangle,
  Shield,
  Globe,
  Briefcase,
  Clock,
  Laptop,
  ShieldAlert,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  Activity,
  Smartphone,
} from 'lucide-react';
import type { HealthAlert } from '@/types/infraGraph';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HealthKpisProps {
  alerts: HealthAlert[];
  selectedAlertType?: string | null;
  onAlertTypeClick: (type: string) => void;
  onClearFilter?: () => void;
}

interface AlertMeta {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  severity: 'error' | 'warning' | 'info';
  description: string;
}

const ALERT_CONFIG: Record<string, AlertMeta> = {
  tiktok_account_device_ban_risk: {
    label: 'Ban Risk TikTok (6+ Aparelhos)',
    icon: ShieldAlert,
    severity: 'error',
    description: 'Conta TikTok conectada a 6 ou mais dispositivos (risco iminente de suspensão permanente)',
  },
  tiktok_account_multiple_devices: {
    label: 'TikTok Multi-Dispositivo',
    icon: Smartphone,
    severity: 'warning',
    description: 'Conta TikTok vinculada a múltiplos dispositivos (não ideal para TikTok, recomendado 1:1)',
  },
  device_multiple_tiktok_accounts: {
    label: 'Aparelho com Várias Contas TikTok',
    icon: Laptop,
    severity: 'warning',
    description: 'Dispositivo executando múltiplas contas TikTok (não ideal para TikTok, recomendado 1:1)',
  },
  proxy_shared_multiple_devices: {
    label: 'Proxy em Múltiplos Aparelhos',
    icon: Shield,
    severity: 'warning',
    description: 'Proxy compartilhado entre vários dispositivos (não ideal para isolamento no TikTok)',
  },
  proxy_shared_multiple_bcs: {
    label: 'Proxy em Múltiplos Business Centers',
    icon: Briefcase,
    severity: 'warning',
    description: 'Proxy compartilhado entre múltiplos Business Centers do TikTok (não recomendado)',
  },
  proxy_without_account: {
    label: 'Proxies sem Conta',
    icon: Shield,
    severity: 'warning',
    description: 'Proxies ativos sem nenhuma conta de plataforma vinculada',
  },
  account_without_proxy: {
    label: 'Contas sem Proxy',
    icon: Globe,
    severity: 'warning',
    description: 'Contas operando sem proxy atribuído (risco de fingerprint)',
  },
  browser_profile_without_account: {
    label: 'Perfis sem Conta',
    icon: Laptop,
    severity: 'warning',
    description: 'Perfis de navegador sem conta de plataforma vinculada',
  },
  country_mismatch: {
    label: 'Conflito de País',
    icon: AlertTriangle,
    severity: 'error',
    description: 'País do proxy diferente da região configurada na conta',
  },
  shared_proxy: {
    label: 'Proxy Compartilhado',
    icon: ShieldAlert,
    severity: 'error',
    description: 'Proxy dedicado (estático) compartilhado entre múltiplas contas',
  },
  ad_account_without_bc: {
    label: 'Contas sem BC',
    icon: Briefcase,
    severity: 'warning',
    description: 'Contas de anúncio sem vínculo a um Business Center',
  },
  expired_proxy_active: {
    label: 'Proxies Expirados',
    icon: Clock,
    severity: 'error',
    description: 'Proxies marcados como ativos com data de expiração no passado',
  },
};

export const HealthKpis: React.FC<HealthKpisProps> = ({
  alerts,
  selectedAlertType,
  onAlertTypeClick,
  onClearFilter,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  // Group active actionable alerts by type and extract aggregated info
  const alertMap = React.useMemo(() => {
    const map = new Map<string, { count: number; alert: HealthAlert; meta: AlertMeta }>();

    for (const alert of alerts) {
      if (!alert.count || alert.count <= 0 || alert.severity === 'info') {
        continue;
      }

      const meta = ALERT_CONFIG[alert.type] || {
        label: alert.label || alert.type.replace(/_/g, ' '),
        icon: alert.severity === 'error' ? AlertTriangle : Shield,
        severity: alert.severity,
        description: alert.message,
      };

      const existing = map.get(alert.type);
      if (existing) {
        existing.count += alert.count;
      } else {
        map.set(alert.type, {
          count: alert.count,
          alert,
          meta,
        });
      }
    }

    return map;
  }, [alerts]);

  const { totalErrors, totalWarnings, totalIssues } = React.useMemo(() => {
    const errors = alerts.filter((a) => a.severity === 'error' && (a.count ?? 0) > 0).length;
    const warnings = alerts.filter((a) => a.severity === 'warning' && (a.count ?? 0) > 0).length;
    return {
      totalErrors: errors,
      totalWarnings: warnings,
      totalIssues: errors + warnings,
    };
  }, [alerts]);

  return (
    <div className="bg-card/90 backdrop-blur-md border-b border-border/80 transition-all select-none">
      {/* Status Bar Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Diagnóstico de Infraestrutura
            </span>
          </div>

          {totalIssues === 0 ? (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 gap-1.5 py-0.5 px-2.5 font-medium text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              100% Saudável (Nenhum alerta)
            </Badge>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  'gap-1.5 py-0.5 px-2.5 font-medium text-xs',
                  totalErrors > 0
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                )}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {totalIssues} {totalIssues === 1 ? 'Alerta Encontrado' : 'Alertas Encontrados'}
              </Badge>

              {totalErrors > 0 && (
                <span className="text-[11px] text-rose-400 font-mono">
                  {totalErrors} {totalErrors === 1 ? 'crítico' : 'críticos'}
                </span>
              )}

              {totalWarnings > 0 && (
                <span className="text-[11px] text-amber-400 font-mono">
                  {totalWarnings} {totalWarnings === 1 ? 'aviso' : 'avisos'}
                </span>
              )}
            </div>
          )}

          {selectedAlertType && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilter}
              className="h-6 text-[11px] px-2 text-muted-foreground hover:text-foreground gap-1"
            >
              <X className="w-3 h-3" />
              Limpar foco
            </Button>
          )}
        </div>

        {alertMap.size > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5 cursor-pointer"
            aria-label={collapsed ? 'Expandir painel de alertas' : 'Recolher painel de alertas'}
          >
            <span>{collapsed ? 'Ver detalhes' : 'Recolher'}</span>
            {collapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </Button>
        )}
      </div>

      {/* Alert Chips (collapsible) */}
      {!collapsed && alertMap.size > 0 && (
        <div className="px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {Array.from(alertMap.entries()).map(([type, { count, meta }]) => {
            const Icon = meta.icon;
            const isSelected = selectedAlertType === type;
            const isError = meta.severity === 'error';

            return (
              <button
                key={type}
                type="button"
                onClick={() => onAlertTypeClick(type)}
                title={`${meta.description} (clique para isolar no mapa)`}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-left transition-all shrink-0 cursor-pointer',
                  'hover:scale-[1.02] active:scale-[0.98]',
                  isSelected
                    ? isError
                      ? 'bg-rose-500/20 border-rose-500 ring-2 ring-rose-500/40 text-rose-200 shadow-md'
                      : 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/40 text-amber-200 shadow-md'
                    : isError
                    ? 'bg-rose-950/30 border-rose-500/30 text-rose-300 hover:border-rose-500/60'
                    : 'bg-amber-950/20 border-amber-500/30 text-amber-300 hover:border-amber-500/60'
                )}
              >
                <Icon
                  className={cn(
                    'w-3.5 h-3.5 shrink-0',
                    isError ? 'text-rose-400' : 'text-amber-400'
                  )}
                />
                <span className="text-xs font-medium leading-none whitespace-nowrap">
                  {meta.label}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold tabular-nums',
                    isError
                      ? 'bg-rose-500/30 text-rose-200'
                      : 'bg-amber-500/30 text-amber-200'
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
