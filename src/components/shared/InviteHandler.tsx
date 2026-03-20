'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { acceptInvite } from '@/lib/actions/member';

export default function InviteHandler() {
  const router = useRouter();
  const { update } = useSession();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('pending-invite');
    if (!token) return;

    localStorage.removeItem('pending-invite');

    acceptInvite(token).then(async (result) => {
      if (result.success && result.data) {
        // Update the JWT with the new mosqueId and role
        await update({
          mosqueId: result.data.mosqueId,
          role: result.data.role,
        });
        setMessage('You have joined the mosque! Redirecting...');
        setTimeout(() => {
          router.refresh();
          setMessage(null);
        }, 1500);
      }
      // If it fails (already a member, expired, etc.), silently ignore
    });
  }, [router, update]);

  if (!message) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground shadow-lg">
      {message}
    </div>
  );
}
