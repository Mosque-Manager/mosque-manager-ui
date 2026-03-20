'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface InviteClientProps {
  mosqueName: string;
  mosqueCity?: string;
  role: 'admin' | 'member';
  token: string;
}

export default function InviteClient({
  mosqueName,
  mosqueCity,
  token,
}: InviteClientProps) {
  // Store token in localStorage so it persists through signup/login
  if (typeof window !== 'undefined') {
    localStorage.setItem('pending-invite', token);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center space-y-2">
            <div className="text-4xl">🕌</div>
            <CardTitle className="text-2xl">
              You&apos;re invited to join
            </CardTitle>
            <CardDescription className="text-lg font-medium text-foreground">
              {mosqueName}
              {mosqueCity && (
                <span className="block text-sm text-muted-foreground font-normal">
                  {mosqueCity}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Create an account or log in to join this mosque and view its data.
            </p>
            <Button asChild className="w-full">
              <Link href={`/signup?invite=${token}`}>
                Create Account
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/login?invite=${token}`}>
                I already have an account
              </Link>
            </Button>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-xs text-muted-foreground">
              This invite expires in 7 days
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
