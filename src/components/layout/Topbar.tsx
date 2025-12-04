import { useAuthStore } from '@/stores/authStore';
import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface TopbarProps {
  collapsed: boolean;
}

export function Topbar({ collapsed }: TopbarProps) {
  const { user } = useAuthStore();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header
      className={`fixed top-0 right-0 z-30 h-16 bg-card border-b border-border flex items-center justify-between px-6 transition-all duration-300 ${
        collapsed ? 'left-16' : 'left-64'
      }`}
    >
      {/* Spacer to keep layout balanced */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-black text-white text-sm">
              {user?.name ? getInitials(user.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-black">{user?.name}</p>
            <p className="text-xs capitalize text-muted-foreground">{user?.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
