import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { LayoutDashboard, Users, HardDrive, Bell, History, LogOut, Menu, Droplets } from 'lucide-react';
import { Badge } from './ui/badge';
import { authAPI, alertsAPI } from '../utils/api';
import { toast } from 'sonner';

const Layout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [alertsCount, setAlertsCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    loadUser();
    loadAlertsCount();
  }, []);

  const loadUser = async () => {
    try {
      const response = await authAPI.getMe();
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      console.error('Error loading user:', error);
      toast.error('Error al cargar datos del usuario');
    }
  };

  const loadAlertsCount = async () => {
    try {
      const response = await alertsAPI.getAll(false, 100);
      setAlertsCount(response.data.length);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, show: true },
    { name: 'Dispositivos', href: '/devices', icon: HardDrive, show: true },
    { name: 'Alertas', href: '/alerts', icon: Bell, show: true, badge: alertsCount },
    { name: 'Historial', href: '/history', icon: History, show: true },
    { name: 'Usuarios', href: '/users', icon: Users, show: true },
    { name: 'DashboardRiego', href: '/dashboardRiego', icon: Users, show: true },
    {name: 'Reports', href: '/reports', icon: Users, show: true }
  ];

  const NavLinks = ({ mobile = false }) => (
    <nav className="flex flex-col gap-1">
      {navigation.map((item) => {
        if (!item.show) return null;
        const Icon = item.icon;
        const isActive = location.pathname === item.href || location.pathname === item.href.slice(0, -1);
        
        return (
          <Link
            key={item.name}
            to={item.href}
            onClick={() => mobile && setMobileOpen(false)}
            data-testid={`nav-link-${item.name.toLowerCase()}`}
            className={`flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-secondary-foreground'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{item.name}</span>
            {item.badge > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon" data-testid="mobile-menu-button">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <div className="flex items-center gap-2 mb-6">
                <Droplets className="h-6 w-6 text-primary" />
                <span className="font-semibold text-lg">AquaSense</span>
              </div>
              <NavLinks mobile />
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <Droplets className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg hidden sm:inline">AquaSense IoT</span>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              data-testid="logout-button"
              title="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col border-r bg-card/60 min-h-[calc(100vh-4rem)]">
          <div className="p-4">
            <NavLinks />
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-[1300px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
