
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
  Search,
  Menu,
  Bell,
  Mail,
  X,
  ShoppingCart,
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

// ── Route → nav style mapping ────────────────────────────────────────────────
const NAV_ROUTES = {
  ecommerce: [
    { to: '/dashboard', label: 'Dashboard',   accent: 'text-[hsl(var(--chart-2))]',  dot: 'bg-[hsl(var(--chart-2))]',  dotMuted: 'bg-[hsl(var(--chart-2)/0.4)]',  active: 'bg-[hsl(var(--chart-2)/0.08)] text-[hsl(var(--chart-2))] font-semibold' },
    { to: '/',          label: 'Calculadora', accent: 'text-[hsl(var(--chart-2))]',  dot: 'bg-[hsl(var(--chart-2))]',  dotMuted: 'bg-[hsl(var(--chart-2)/0.4)]',  active: 'bg-[hsl(var(--chart-2)/0.08)] text-[hsl(var(--chart-2))] font-semibold' },
    { to: '/produtos',  label: 'Produtos',    accent: 'text-[hsl(var(--brand))]',    dot: 'bg-[hsl(var(--brand))]',    dotMuted: 'bg-[hsl(var(--brand)/0.4)]',    active: 'bg-[hsl(var(--brand)/0.08)] text-[hsl(var(--brand))] font-semibold' },
    { to: '/leads',     label: 'Leads',       accent: 'text-[hsl(var(--chart-5))]',  dot: 'bg-[hsl(var(--chart-5))]',  dotMuted: 'bg-[hsl(var(--chart-5)/0.4)]',  active: 'bg-[hsl(var(--chart-5)/0.08)] text-[hsl(var(--chart-5))] font-semibold' },
  ],
  painel: [
    { to: '/vendas',    label: 'Vendas',      accent: 'text-[hsl(var(--success))]',  dot: 'bg-[hsl(var(--success))]',  dotMuted: 'bg-[hsl(var(--success)/0.4)]',  active: 'bg-[hsl(var(--success)/0.08)] text-[hsl(var(--success))] font-semibold' },
    { to: '/campanhas', label: 'Campanhas',   accent: 'text-[hsl(var(--warning))]',  dot: 'bg-[hsl(var(--warning))]',  dotMuted: 'bg-[hsl(var(--warning)/0.4)]',  active: 'bg-[hsl(var(--warning)/0.08)] text-[hsl(var(--warning))] font-semibold' },
    { to: '/repasse',   label: 'Repasse',     accent: 'text-[hsl(var(--chart-6))]',  dot: 'bg-[hsl(var(--chart-6))]',  dotMuted: 'bg-[hsl(var(--chart-6)/0.4)]',  active: 'bg-[hsl(var(--chart-6)/0.08)] text-[hsl(var(--chart-6))] font-semibold' },
  ],
} as const;

type RouteItem = typeof NAV_ROUTES.ecommerce[number] | typeof NAV_ROUTES.painel[number];

// ── Reusable NavLink ──────────────────────────────────────────────────────────
function NavLink({ route, pathname, e2eSearch }: { route: RouteItem; pathname: string; e2eSearch: string }) {
  const isActive = route.to === '/' ? pathname === '/' : pathname.startsWith(route.to);
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ecommerceOpen, setEcommerceOpen] = useState(true);
  const [painelOpen, setPainelOpen] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [blingNotifications, setBlingNotifications] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { organizationId } = useSettings();
  const { isAdmin, profile } = useUser();
  const e2eSearch = new URLSearchParams(location.search).get('e2e') === 'true' ? '?e2e=true' : '';

  // Sync search term from URL
  useEffect(() => {
    const nextSearch = new URLSearchParams(location.search);
    setSearchTerm(nextSearch.get('q') || '');
  }, [location.search]);

  // Live URL update on search
  useEffect(() => {
    const trimmed = searchTerm.trim();
    const nextParams = new URLSearchParams(location.search);
    if (trimmed) {
      nextParams.set('q', trimmed);
    } else {
      nextParams.delete('q');
    }
    if (!nextParams.get('e2e') && e2eSearch) nextParams.set('e2e', 'true');
    const newSearch = nextParams.toString() ? `?${nextParams.toString()}` : '';
    if (newSearch !== location.search) {
      navigate({ pathname: location.pathname, search: newSearch }, { replace: true });
    }
  }, [searchTerm, navigate, location.pathname, location.search, e2eSearch]);

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

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300
          bg-card border-r border-border
          ${sidebarOpen ? 'w-60 translate-x-0' : 'w-60 -translate-x-full lg:translate-x-0 lg:w-0 border-none'}`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto flex flex-col">
          {/* Logo row */}
          <div className="flex items-center justify-between mb-6 h-10 px-1">
            {sidebarOpen && (
              <>
                <img src={logo} alt="Alob Express" className="h-9 object-contain" />
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
                {ecommerceOpen && (
                  <ul className="mt-0.5 space-y-0.5 pl-3">
                    {NAV_ROUTES.ecommerce.map(r => (
                      <NavLink key={r.to} route={r} pathname={location.pathname} e2eSearch={e2eSearch} />
                    ))}
                  </ul>
                )}
              </li>

              {/* Painel group (admin only) */}
              {isAdmin && (
                <li className="pt-1">
                  <GroupHeader icon={LayoutDashboard} label="Painel" open={painelOpen} onToggle={() => setPainelOpen(v => !v)} />
                  {painelOpen && (
                    <ul className="mt-0.5 space-y-0.5 pl-3">
                      {NAV_ROUTES.painel.map(r => (
                        <NavLink key={r.to} route={r} pathname={location.pathname} e2eSearch={e2eSearch} />
                      ))}
                    </ul>
                  )}
                </li>
              )}
            </ul>
          </nav>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-60' : 'lg:ml-0'}`}>

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

            {/* Search */}
            <div className="relative hidden md:block w-64" role="search">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-muted-foreground" />
              </div>
              <input
                type="text"
                id="search-navbar"
                className="w-full pl-9 pr-3 py-1.5 text-sm rounded-lg
                  bg-background border border-input
                  text-foreground placeholder:text-muted-foreground
                  focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                  transition-colors"
                placeholder="Pesquisar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                aria-label="Pesquisar produtos"
              />
            </div>
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
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
