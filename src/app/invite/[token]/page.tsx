import { auth } from '@/lib/auth';
import { getInviteDetails } from '@/lib/actions/member';
import InviteClient from './InviteClient';
import InviteAccept from './InviteAccept';

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;
  const result = await getInviteDetails(token);

  if (!result.success || !result.data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="text-4xl">🕌</div>
          <h1 className="text-2xl font-bold">Invalid Invite</h1>
          <p className="text-muted-foreground">{result.message}</p>
        </div>
      </div>
    );
  }

  const { mosqueName, mosqueCity, role, expired, used } = result.data;

  if (expired || used) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="text-4xl">🕌</div>
          <h1 className="text-2xl font-bold">{mosqueName}</h1>
          <p className="text-muted-foreground">
            {expired
              ? 'This invite link has expired. Please ask the admin for a new one.'
              : 'This invite link has already been used.'}
          </p>
        </div>
      </div>
    );
  }

  // If user is logged in, show client component that handles accept + session update
  const session = await auth();
  if (session?.user) {
    return <InviteAccept token={token} mosqueName={mosqueName} />;
  }

  // Not logged in — show signup/login prompt
  return <InviteClient mosqueName={mosqueName} mosqueCity={mosqueCity} role={role} token={token} />;
}
