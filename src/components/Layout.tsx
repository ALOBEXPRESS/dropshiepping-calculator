
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { 
  LogOut, 
  Settings, 
  User, 
  ChevronDown, 
  Sun, 
  Moon, 
  LayoutDashboard, 
  Menu,
  Bell,
  Mail,
  X,
  ShoppingCart,
  Wallet,
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useTheme } from './ThemeProvider';
import { SettingsDialog } from './SettingsDialog';
import logo from '@/assets/logo.png';
import { useSettings } from '@/contexts/SettingsContext';
import { useUser } from '@/contexts/UserContext';

export interface NavRouteItem {
  to: string;
  aliases?: string[];
  label: string;
  adminOnly?: boolean;
  accent: string;
  dot: string;
  dotMuted: string;
  active: string;
  children?: NavRouteItem[];
}

const NAV_ROUTES: {
  ecommerce: NavRouteItem[];
  painel: NavRouteItem[];
} = {
  ecommerce: [
    { to: '/dashboard', label: 'Dashboard',   adminOnly: false, accent: 'text-[hsl(var(--chart-2))]',  dot: 'bg-[hsl(var(--chart-2))]',  dotMuted: 'bg-[hsl(var(--chart-2)/0.4)]',  active: 'bg-[hsl(var(--chart-2)/0.08)] text-[hsl(var(--chart-2))] font-semibold' },
    { to: '/',          label: 'Calculadora', adminOnly: false, accent: 'text-[hsl(var(--chart-2))]',  dot: 'bg-[hsl(var(--chart-2))]',  dotMuted: 'bg-[hsl(var(--chart-2)/0.4)]',  active: 'bg-[hsl(var(--chart-2)/0.08)] text-[hsl(var(--chart-2))] font-semibold' },
    { to: '/produtos',  label: 'Produtos',    adminOnly: false, accent: 'text-[hsl(var(--brand))]',    dot: 'bg-[hsl(var(--brand))]',    dotMuted: 'bg-[hsl(var(--brand)/0.4)]',    active: 'bg-[hsl(var(--brand)/0.08)] text-[hsl(var(--brand))] font-semibold' },
    { to: '/leads',     label: 'Leads',       adminOnly: false, accent: 'text-[hsl(var(--chart-5))]',  dot: 'bg-[hsl(var(--chart-5))]',  dotMuted: 'bg-[hsl(var(--chart-5)/0.4)]',  active: 'bg-[hsl(var(--chart-5)/0.08)] text-[hsl(var(--chart-5))] font-semibold' },
    { to: '/vendas',    label: 'Vendas',      adminOnly: true,  accent: 'text-[hsl(var(--success))]',  dot: 'bg-[hsl(var(--success))]',  dotMuted: 'bg-[hsl(var(--success)/0.4)]',  active: 'bg-[hsl(var(--success)/0.08)] text-[hsl(var(--success))] font-semibold' },
    { to: '/campanhas', label: 'Campanhas',   adminOnly: true,  accent: 'text-[hsl(var(--warning))]',  dot: 'bg-[hsl(var(--warning))]',  dotMuted: 'bg-[hsl(var(--warning)/0.4)]',  active: 'bg-[hsl(var(--warning)/0.08)] text-[hsl(var(--warning))] font-semibold' },
    { to: '/repasse',   label: 'Repasse',     adminOnly: true,  accent: 'text-[hsl(var(--chart-6))]',  dot: 'bg-[hsl(var(--chart-6))]',  dotMuted: 'bg-[hsl(var(--chart-6)/0.4)]',  active: 'bg-[hsl(var(--chart-6)/0.08)] text-[hsl(var(--chart-6))] font-semibold' },
  ],
  painel: [
    {
      to: '/proxies',
      aliases: ['/contas/proxies'],
      label: 'Proxies',
      adminOnly: true,
      accent: 'text-orange-400',
      dot: 'bg-orange-400',
      dotMuted: 'bg-orange-400/40',
      active: 'bg-orange-500/15 text-orange-400 font-semibold',
      children: [
        {
          to: '/provedores',
          aliases: ['/contas/provedores'],
          label: 'Provedores',
          adminOnly: true,
          accent: 'text-amber-400',
          dot: 'bg-amber-400',
          dotMuted: 'bg-amber-400/40',
          active: 'bg-amber-500/15 text-amber-400 font-semibold',
        },
        {
          to: '/dispositivos',
          aliases: ['/contas/dispositivos'],
          label: 'Dispositivos',
          adminOnly: true,
          accent: 'text-emerald-400',
          dot: 'bg-emerald-400',
          dotMuted: 'bg-emerald-400/40',
          active: 'bg-emerald-500/15 text-emerald-400 font-semibold',
        },
        {
          to: '/perfis-navegador',
          aliases: ['/contas/perfis-navegador', '/contas/perfis-de-navegador'],
          label: 'Perfis de Navegador',
          adminOnly: true,
          accent: 'text-cyan-400',
          dot: 'bg-cyan-400',
          dotMuted: 'bg-cyan-400/40',
          active: 'bg-cyan-500/15 text-cyan-400 font-semibold',
        },
      ],
    },
    {
      to: '/business-centers',
      aliases: ['/contas/business-centers'],
      label: 'Business Centers',
      adminOnly: true,
      accent: 'text-purple-400',
      dot: 'bg-purple-400',
      dotMuted: 'bg-purple-400/40',
      active: 'bg-purple-500/15 text-purple-400 font-semibold',
    },
    {
      to: '/contas',
      aliases: ['/contas/conta'],
      label: 'Conta',
      adminOnly: true,
      accent: 'text-[hsl(var(--brand))]',
      dot: 'bg-[hsl(var(--brand))]',
      dotMuted: 'bg-[hsl(var(--brand)/0.4)]',
      active: 'bg-[hsl(var(--brand)/0.12)] text-[hsl(var(--brand))] font-semibold',
    },
    {
      to: '/contas-anuncios',
      label: 'Conta de Anúncio',
      adminOnly: true,
      accent: 'text-[hsl(var(--warning))]',
      dot: 'bg-[hsl(var(--warning))]',
      dotMuted: 'bg-[hsl(var(--warning)/0.4)]',
      active: 'bg-[hsl(var(--warning)/0.12)] text-[hsl(var(--warning))] font-semibold',
    },
    {
      to: '/mapa',
      aliases: ['/contas/mapa'],
      label: 'Mapa de Conexões',
      adminOnly: true,
      accent: 'text-purple-400',
      dot: 'bg-purple-400',
      dotMuted: 'bg-purple-400/40',
      active: 'bg-purple-500/15 text-purple-400 font-semibold',
    },
  ],
};

function isRouteMatching(item: NavRouteItem, pathname: string): boolean {
  const targets = [item.to, ...(item.aliases || [])];
  return targets.some((target) => {
    if (target === '/') {
      return pathname === '/';
    }
    if (pathname === target) {
      return true;
    }
    if (pathname.startsWith(target + '/')) {
      if (target === '/contas') {
        const isOtherModule =
          pathname.startsWith('/contas/business-centers') ||
          pathname.startsWith('/contas/proxies') ||
          pathname.startsWith('/contas/provedores') ||
          pathname.startsWith('/contas/dispositivos') ||
          pathname.startsWith('/contas/perfis-navegador') ||
          pathname.startsWith('/contas/perfis-de-navegador') ||
          pathname.startsWith('/contas/mapa');
        if (isOtherModule) return false;
      }
      return true;
    }
    return false;
  });
}

function useLocalStorageBoolean(key: string, defaultValue: boolean): [boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const [value, setValue] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored !== null ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore
    }
  }, [key, value]);

  return [value, setValue];
}

// ── Reusable NavLink ──────────────────────────────────────────────────────────
function NavLink({ route, pathname, e2eSearch }: { route: NavRouteItem; pathname: string; e2eSearch: string }) {
  const isDirectActive = isRouteMatching(route, pathname);
  const isAnyChildActive = Boolean(route.children?.some(c => isRouteMatching(c, pathname)));
  const isActive = isDirectActive && !isAnyChildActive;

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    return Boolean(isDirectActive || isAnyChildActive);
  });

  // Se rota atual estiver em um dos filhos, mantém o submenu aberto
  useEffect(() => {
    if (isDirectActive || isAnyChildActive) {
      setIsOpen(true);
    }
  }, [isDirectActive, isAnyChildActive]);

  if (route.children && route.children.length > 0) {
    return (
      <li className="space-y-0.5">
        <div className="flex items-center justify-between group">
          <Link
            to={{ pathname: route.to, search: e2eSearch }}
            className={`flex items-center flex-1 px-3 py-2 text-sm rounded-lg no-underline transition-all duration-150 ${
              isActive ? route.active : 'text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            <span className={`w-1.5 h-1.5 mr-2.5 rounded-full flex-shrink-0 transition-colors ${isActive ? route.dot : route.dotMuted}`} />
            <span className="flex-1">{route.label}</span>
          </Link>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsOpen((prev) => !prev);
            }}
            className="p-1.5 mr-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors cursor-pointer"
            aria-label={`Alternar subitens de ${route.label}`}
          >
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
            isOpen ? 'grid-rows-[1fr] opacity-100 mt-0.5' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
          }`}
        >
          <div className="overflow-hidden">
            <div className="ml-4 pl-2.5 border-l border-border/60 space-y-0.5 my-0.5">
              {route.children.map((child) => {
                const isChildActive = isRouteMatching(child, pathname);
                return (
                  <Link
                    key={child.to}
                    to={{ pathname: child.to, search: e2eSearch }}
                    className={`flex items-center w-full px-2.5 py-1.5 text-xs rounded-md no-underline transition-all duration-150 ${
                      isChildActive
                        ? child.active
                        : 'text-muted-foreground hover:bg-accent/70 hover:text-foreground'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 mr-2 rounded-full flex-shrink-0 transition-colors ${
                        isChildActive ? child.dot : child.dotMuted
                      }`}
                    />
                    <span className="truncate">{child.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link
        to={{ pathname: route.to, search: e2eSearch }}
        className={`flex items-center w-full px-3 py-2 text-sm rounded-lg no-underline transition-all duration-150
          ${isActive ? route.active : 'text-muted-foreground hover:bg-accent hover:text-foreground'}`}
      >
        <span className={`w-1.5 h-1.5 mr-2.5 rounded-full flex-shrink-0 transition-colors ${isActive ? route.dot : route.dotMuted}`} />
        {route.label}
      </Link>
    </li>
  );
}

// ── Main Layout ───────────────────────────────────────────────────────────────
export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(() => 
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ecommerceOpen, setEcommerceOpen] = useLocalStorageBoolean('nav_group_ecommerce_open', true);
  const [painelOpen, setPainelOpen] = useLocalStorageBoolean('nav_group_painel_open', true);
  const [contasOpen, setContasOpen] = useLocalStorageBoolean('nav_group_contas_open', false);
  const [blingNotifications, setBlingNotifications] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { organizationId } = useSettings();
  const { isAdmin, profile } = useUser();
  const e2eSearch = new URLSearchParams(location.search).get('e2e') === 'true' ? '?e2e=true' : '';

  // Fecha a sidebar automaticamente ao navegar em telas mobile/tablet (< 1024px)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  // Bling real-time notifications
  useEffect(() => {
    const channel = supabase
      .channel('products_bling_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products_bling' }, (payload) => {
        const nextOrgId = (payload as { new?: { organization_id?: string | null }; old?: { organization_id?: string | null } })
          .new?.organization_id ?? (payload as { old?: { organization_id?: string | null } }).old?.organization_id;
        if (organizationId && nextOrgId && nextOrgId !== organizationId) return;
        setBlingNotifications((prev) => prev + 1);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organizationId]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      navigate('/login');
    }
  };

  // ── Group header button ───────────────────────────────────────────────────
  const GroupHeader = ({ icon: Icon, label, open, onToggle }: { icon: React.ElementType; label: string; open: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
    >
      <Icon className="w-4 h-4 text-[hsl(var(--warning))] flex-shrink-0" />
      <span className="flex-1 text-left text-[10px] font-semibold uppercase tracking-widest">{label}</span>
      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
    </button>
  );

  const isMapPage = location.pathname === '/mapa' || location.pathname === '/contas/mapa';

  return (
    <div className={`min-h-screen ${isMapPage ? 'h-screen overflow-hidden' : ''} bg-background text-foreground transition-colors duration-300`}>
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* ── Mobile backdrop ───────────────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-35 bg-black/60 backdrop-blur-xs lg:hidden transition-opacity cursor-pointer"
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-out
          bg-card border-r border-border
          animate-in fade-in duration-500
          ${sidebarOpen ? 'w-60 translate-x-0' : 'w-60 -translate-x-full lg:translate-x-0 lg:w-0 border-none'}`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto flex flex-col transition-opacity duration-300">
          {/* Logo row */}
          <div className="flex items-center justify-between mb-6 h-10 px-1">
            {sidebarOpen && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => {
                    navigate('/dashboard');
                    if (location.pathname === '/dashboard') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                  className="cursor-pointer transition-all hover:opacity-85 hover:scale-[1.02] active:scale-[0.98] inline-flex items-center"
                  aria-label="Ir para a Dashboard"
                >
                  <img src={logo} alt="Alob Express" className="h-9 object-contain" />
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Fechar menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1">
            <ul className="space-y-0.5">
              {/* E-Commerce group */}
              <li>
                <GroupHeader icon={ShoppingCart} label="E-Commerce" open={ecommerceOpen} onToggle={() => setEcommerceOpen(v => !v)} />
                <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${ecommerceOpen ? 'grid-rows-[1fr] opacity-100 mt-0.5' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                  <div className="overflow-hidden">
                    <ul className="space-y-0.5 pl-3 pb-1">
                      {NAV_ROUTES.ecommerce
                        .filter(r => !r.adminOnly || isAdmin)
                        .map(r => (
                          <NavLink key={r.to} route={r} pathname={location.pathname} e2eSearch={e2eSearch} />
                        ))}
                    </ul>
                  </div>
                </div>
              </li>

              {/* Painel group */}
              <li className="pt-1">
                <GroupHeader icon={LayoutDashboard} label="Painel" open={painelOpen} onToggle={() => setPainelOpen(v => !v)} />
                <div className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${painelOpen ? 'grid-rows-[1fr] opacity-100 mt-0.5' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                  <div className="overflow-hidden">
                    <ul className="space-y-0.5 pl-3 pb-1">

                      {/* Subgrupo: Contas */}
                      {isAdmin && (
                        <li>
                          <button
                            type="button"
                            onClick={() => setContasOpen(v => !v)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
                            data-testid="nav-contas-subgroup"
                          >
                            <Wallet className="w-3.5 h-3.5 text-[hsl(var(--warning))] flex-shrink-0" />
                            <span className="flex-1 text-left text-[10px] font-semibold uppercase tracking-widest">Contas</span>
                            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${contasOpen ? 'rotate-180' : ''}`} />
                          </button>
                          <div className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${contasOpen ? 'grid-rows-[1fr] opacity-100 mt-0.5' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}>
                            <div className="overflow-hidden">
                              <ul className="space-y-0.5 pl-3">
                                {NAV_ROUTES.painel
                                  .filter(r => !r.adminOnly || isAdmin)
                                  .map(r => (
                                    <NavLink key={r.to} route={r} pathname={location.pathname} e2eSearch={e2eSearch} />
                                  ))}
                              </ul>
                            </div>
                          </div>
                        </li>
                      )}

                      {/* Fallback se não houver rotas para o usuário */}
                      {!isAdmin && (
                        <li className="px-3 py-1.5 text-xs text-muted-foreground/60 italic">
                          Em breve
                        </li>
                      )}

                    </ul>
                  </div>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className={`${isMapPage ? 'h-screen max-h-screen overflow-hidden' : 'min-h-screen'} flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-60' : 'lg:ml-0'}`}>

        {/* Header / Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 h-14
          bg-card/80 backdrop-blur-sm border-b border-border shadow-sm">

          {/* Left — menu toggle + search */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Abrir menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            {sidebarOpen && (
              <button
                className="p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => setSidebarOpen(false)}
                aria-label="Fechar menu"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}


          </div>

          {/* Right — actions + avatar */}
          <div className="flex items-center gap-1">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            {/* Mail */}
            <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex" aria-label="Mensagens">
              <Mail className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hidden sm:flex relative"
              id="bling-notify"
              aria-label={`Notificações${blingNotifications > 0 ? ` — ${blingNotifications} novas` : ''}`}
              onClick={() => setBlingNotifications(0)}
            >
              <Bell className="h-4 w-4" />
              {blingNotifications > 0 && (
                <span
                  className="absolute top-2 right-2 h-2 w-2 bg-[hsl(var(--brand))] rounded-full animate-pulse"
                  id="bling-notify-dot"
                  aria-hidden="true"
                />
              )}
            </Button>

            {/* Avatar / User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="flex items-center gap-2 cursor-pointer hover:bg-accent px-2 py-1 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ml-1"
                  aria-label="Menu do usuário"
                >
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={profile?.avatar_url || 'https://github.com/shadcn.png'} alt="avatar" />
                    <AvatarFallback className="text-xs">{profile?.first_name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium leading-none">
                      {profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuário' : 'Usuário'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{isAdmin ? 'Admin' : 'Membro'}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Mail className="mr-2 h-4 w-4" />
                  <span>Mensagens</span>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setSettingsOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-danger focus:text-danger focus:bg-danger-muted"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page content */}
        <main className={isMapPage ? "flex-1 flex flex-col min-h-0 p-0 overflow-hidden" : "flex-1 p-4 md:p-6"}>
          {children}
        </main>

        {/* Global Footer */}
        {!isMapPage && (
          <footer className="py-6 px-4 border-t border-border/40 text-center mt-auto bg-card/30">
            <p className="text-gray-400 text-sm font-medium font-iceland tracking-wide">Desenvolvido por: Jonatan Renan</p>
            <p className="text-gray-600 text-xs mt-1">Alob Express © todos os direitos reservados</p>
          </footer>
        )}
      </div>
    </div>
  );
}
