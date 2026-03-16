'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  LogOut,
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import type { SessionUser } from '@/types';

interface SidebarProps {
  user: SessionUser;
  mobile?: boolean;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  show: boolean;
}

export default function Sidebar({ user, mobile = false }: SidebarProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      href: '/',
      icon: <LayoutDashboard className="h-4 w-4" />,
      show: true,
    },
    {
      label: 'Mosques',
      href: '/mosques',
      icon: <Building2 className="h-4 w-4" />,
      show: user.isSuperAdmin,
    },
  ];

  const visibleItems = navItems.filter((item) => item.show);

  return (
    <aside
      className={cn(
        'flex h-screen w-64 flex-col border-r bg-card',
        mobile ? 'flex' : 'hidden md:flex'
      )}
    >
      <div className="flex h-14 items-center px-4 font-semibold text-lg">
        🕌 Masjid Manager
      </div>
      <Separator />
      <nav className="flex-1 space-y-1 p-2">
        {visibleItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
              pathname === item.href
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground'
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>
      <Separator />
      <div className="p-4">
        <div className="mb-2 text-xs text-muted-foreground truncate">
          {user.email}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="h-4 w-4" />
          Log out
        </Button>
      </div>
    </aside>
  );
}
