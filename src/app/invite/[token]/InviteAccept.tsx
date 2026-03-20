'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { acceptInvite } from '@/lib/actions/member';

interface InviteAcceptProps {
  token: string;
  mosqueName: string;
}

export default function InviteAccept({ token, mosqueName }: InviteAcceptProps) {
  const router = useRouter();
  const { update } = useSession();
  const [status, setStatus] = useState<'accepting' | 'success' | 'error'>('accepting');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    acceptInvite(token).then(async (result) => {
      if (result.success && result.data) {
        await update({
          mosqueId: result.data.mosqueId,
          role: result.data.role,
        });
        setStatus('success');
        setTimeout(() => {
          router.push('/');
          router.refresh();
        }, 1500);
      } else {
        setStatus('error');
        setErrorMessage(result.message);
      }
    });
  }, [token, router, update]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md text-center space-y-4">
        <div className="text-4xl">🕌</div>
        <h1 className="text-2xl font-bold">{mosqueName}</h1>
        {status === 'accepting' && (
          <p className="text-muted-foreground">Joining mosque...</p>
        )}
        {status === 'success' && (
          <p className="text-green-600 font-medium">You have joined the mosque! Redirecting...</p>
        )}
        {status === 'error' && (
          <p className="text-muted-foreground">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}
