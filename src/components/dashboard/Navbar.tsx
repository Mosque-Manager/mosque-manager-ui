'use client';

import { useState } from 'react';
import { Menu, LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import type { SessionUser } from '@/types';

interface NavbarProps {
  user: SessionUser;
  onMenuClick: () => void;
}

export default function Navbar({ user, onMenuClick }: NavbarProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-card px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <div className="flex-1">
        <h2 className="text-sm font-medium text-muted-foreground md:hidden">
          🕌 Masjid Manager
        </h2>
      </div>

      <div className="relative flex items-center gap-2">
        <button
          onClick={() => setShowDropdown((prev) => !prev)}
          className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted transition-colors"
        >
          <div className="text-right">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-muted-foreground">
              {user.isSuperAdmin ? 'Super Admin' : user.role || 'Member'}
            </p>
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
            {user.name?.charAt(0)?.toUpperCase()}
          </div>
        </button>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-md border bg-card shadow-md">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-muted transition-colors rounded-md"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
