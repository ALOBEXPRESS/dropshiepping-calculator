
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
  X
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

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [blingNotifications, setBlingNotifications] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { organizationId } = useSettings();
  const e2eSearch = new URLSearchParams(location.search).get('e2e') === 'true' ? '?e2e=true' : '';

  useEffect(() => {
    const nextSearch = new URLSearchParams(location.search);
    setSearchTerm(nextSearch.get('q') || '');
  }, [location.search]);

  // Atualizar a URL em tempo real conforme o usuário digita
  useEffect(() => {
    const trimmed = searchTerm.trim();
    const nextParams = new URLSearchParams(location.search);
    
    if (trimmed) {
      nextParams.set('q', trimmed);
    } else {
      nextParams.delete('q');
    }
    
    if (!nextParams.get('e2e') && e2eSearch) {
      nextParams.set('e2e', 'true');
    }
    
    const newSearch = nextParams.toString() ? `?${nextParams.toString()}` : '';
    const currentSearch = location.search;
    
    // Só navegar se a URL mudou
    if (newSearch !== currentSearch) {
      navigate({ pathname: location.pathname, search: newSearch }, { replace: true });
    }
  }, [searchTerm, navigate, location.pathname, location.search, e2eSearch]);

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

    return () => {
      supabase.removeChannel(channel);
    };
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors duration-300">
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      
      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-40 h-screen transition-transform bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 ${
          sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0 lg:w-0 border-none'
        }`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto relative">
          <div className="flex items-center justify-between mb-8 h-12 px-2">
             {sidebarOpen && (
                <>
                    <img src={logo} alt="Logo" className="h-10 object-contain" />
                    <button 
                        onClick={() => setSidebarOpen(false)}
                        className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </>
             )}
          </div>
          
          <ul className="space-y-2 font-medium">
            <li>
              <div className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 group cursor-pointer">
                <LayoutDashboard className="w-5 h-5 text-gray-500 transition duration-75 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                <span className="ml-3">Painel</span>
                <ChevronDown className="w-4 h-4 ml-auto" />
              </div>
              <ul className="py-2 space-y-1 pl-8">
                  <li>
                      <Link
                        to={{ pathname: '/', search: e2eSearch }}
                        className={`flex items-center w-full p-2 text-sm transition-all duration-150 rounded-lg pl-4 group no-underline
                          ${location.pathname === '/'
                            ? 'bg-blue-500/10 text-blue-400 font-semibold'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white'
                          }`}
                      >
                          <span className={`w-1.5 h-1.5 mr-2.5 rounded-full flex-shrink-0 ${location.pathname === '/' ? 'bg-blue-400' : 'bg-blue-500/60'}`} />
                          Calculadora
                      </Link>
                  </li>
                  <li>
                      <Link
                        to={{ pathname: '/produtos', search: e2eSearch }}
                        className={`flex items-center w-full p-2 text-sm transition-all duration-150 rounded-lg pl-4 group no-underline
                          ${location.pathname === '/produtos'
                            ? 'bg-pink-500/10 text-pink-400 font-semibold'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white'
                          }`}
                      >
                          <span className={`w-1.5 h-1.5 mr-2.5 rounded-full flex-shrink-0 ${location.pathname === '/produtos' ? 'bg-pink-400' : 'bg-pink-500/60'}`} />
                          Produtos
                      </Link>
                  </li>
                  <li>
                      <Link
                        to={{ pathname: '/vendas', search: e2eSearch }}
                        className={`flex items-center w-full p-2 text-sm transition-all duration-150 rounded-lg pl-4 group no-underline
                          ${location.pathname === '/vendas'
                            ? 'bg-green-500/10 text-green-400 font-semibold'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white'
                          }`}
                      >
                          <span className={`w-1.5 h-1.5 mr-2.5 rounded-full flex-shrink-0 ${location.pathname === '/vendas' ? 'bg-green-400' : 'bg-green-500/60'}`} />
                          Vendas
                      </Link>
                  </li>
                  <li>
                      <Link
                        to={{ pathname: '/leads', search: e2eSearch }}
                        className={`flex items-center w-full p-2 text-sm transition-all duration-150 rounded-lg pl-4 group no-underline
                          ${location.pathname === '/leads'
                            ? 'bg-purple-500/10 text-purple-400 font-semibold'
                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-white'
                          }`}
                      >
                          <span className={`w-1.5 h-1.5 mr-2.5 rounded-full flex-shrink-0 ${location.pathname === '/leads' ? 'bg-purple-400' : 'bg-purple-500/60'}`} />
                          Leads
                      </Link>
                  </li>
              </ul>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`p-4 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'} transition-all duration-300`}>
        {/* Header */}
        <header className="mb-6 flex items-center justify-between bg-white dark:bg-zinc-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-zinc-800">
            <div className="flex items-center gap-4">
                {!sidebarOpen && (
                    <button 
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700"
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                )}
                {sidebarOpen && (
                    <button 
                        className="p-2 text-gray-500 rounded-lg hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <Menu className="w-6 h-6" />
                    </button>
                )}
                <div className="relative hidden md:block" role="search">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                        <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="search-navbar"
                      className="block w-full p-2 ps-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:border-zinc-700 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      placeholder="Pesquisar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Pesquisar produtos"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <Button variant="ghost" size="icon" className="rounded-full dark:text-white" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                    {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
                
                <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex">
                    <Mail className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full hidden sm:flex relative"
                  id="bling-notify"
                  title="Notificações"
                  onClick={() => setBlingNotifications(0)}
                >
                  <Bell className="h-5 w-5" />
                  {blingNotifications > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full" id="bling-notify-dot"></span>
                  )}
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-800 p-1 rounded-full pr-3 transition-colors">
                            <Avatar>
                                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                                <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                            <div className="hidden md:block text-left">
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Admin User</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Admin</p>
                            </div>
                        </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>My Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                            <Mail className="mr-2 h-4 w-4" />
                            <span>Inbox</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer" onClick={() => setSettingsOpen(true)}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Settings</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log Out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>

        {children}
      </div>
    </div>
  );
}
