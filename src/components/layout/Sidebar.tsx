import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore, isAdmin } from '@/stores/authStore';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserCog,
  ClipboardList,
  FileBarChart,
  KeyRound,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const adminMenuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/master/division', icon: Building2, label: 'Master Divisi' },
  { path: '/master/employee', icon: Users, label: 'Master Pegawai' },
  { path: '/master/user', icon: UserCog, label: 'Master Pengguna' },
  { path: '/tasks', icon: ClipboardList, label: 'Tugas' },
  { path: '/reports', icon: FileBarChart, label: 'Laporan' },
];

const employeeMenuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/tasks', icon: ClipboardList, label: 'Tugas' },
  { path: '/change-password', icon: KeyRound, label: 'Ubah Kata Sandi' },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const menuItems = isAdmin(user?.role) ? adminMenuItems : employeeMenuItems;

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen sidebar-surface border-r border-border/60 transition-all duration-300 flex flex-col',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-sidebar-border/30">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 shadow-inner flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <span className="font-heading font-semibold tracking-wide text-white">WorkMonitor</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="h-8 w-8 text-sidebar-foreground hover:text-primary/80 hover:bg-transparent focus-visible:ring-0 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <TooltipProvider delayDuration={200}>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            const link = (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'sidebar-item',
                  isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'
                )}
              >
                <item.icon className={cn('w-5 h-5 shrink-0', isActive ? 'text-primary' : 'text-sidebar-foreground')} />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );

            return collapsed ? (
              <Tooltip key={item.path}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="right" align="center">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            ) : (
              link
            );
          })}
        </nav>
      </TooltipProvider>

      {/* Logout */}
      <div className="p-3 border-t border-sidebar-border/30">
        <button
          onClick={logout}
          className={cn(
            'sidebar-item sidebar-item-inactive w-full text-destructive hover:bg-destructive/10 hover:text-destructive',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Keluar' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
