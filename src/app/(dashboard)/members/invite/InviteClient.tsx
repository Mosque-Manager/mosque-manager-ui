'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  createInviteLink,
  getInviteHistory,
  type InviteHistoryItem,
} from '@/lib/actions/member';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Copy, Check, Share2 } from 'lucide-react';

export default function InviteClient() {
  const [role, setRole] = useState<'admin' | 'member'>('member');
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<InviteHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setHistoryLoading(true);
    const data = await getInviteHistory();
    setHistory(data);
    setHistoryLoading(false);
  }

  async function handleGenerate() {
    setLoading(true);
    const result = await createInviteLink(role);
    if (result.success && result.data) {
      setGeneratedUrl(result.data.url);
      await loadHistory();
    }
    setLoading(false);
  }

  async function handleCopy() {
    if (!generatedUrl) return;
    await navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsAppShare() {
    if (!generatedUrl) return;
    const message = `You're invited to join our mosque on Masjid Manager! Click the link to join:\n\n${generatedUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/members">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Invite Member</h1>
          <p className="text-muted-foreground">
            Generate a link and share via WhatsApp
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Generate Invite Link</CardTitle>
          <CardDescription>
            Choose a role and generate a shareable invite link. Links expire in 7 days.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={role} onValueChange={(v) => setRole(v as 'admin' | 'member')}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? 'Generating...' : 'Generate Link'}
            </Button>
          </div>

          {generatedUrl && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
                <code className="flex-1 text-sm break-all">{generatedUrl}</code>
                <Button variant="ghost" size="sm" onClick={handleCopy}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <Button onClick={handleWhatsAppShare} className="w-full bg-green-600 hover:bg-green-700">
                <Share2 className="h-4 w-4 mr-2" />
                Share via WhatsApp
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invite History</CardTitle>
          <CardDescription>
            Recent invite links — last 20
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">No invites yet</div>
          ) : (
            <div className="rounded-md border">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-2 text-left text-sm font-medium">Role</th>
                    <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-medium hidden sm:table-cell">Used By</th>
                    <th className="px-4 py-2 text-left text-sm font-medium hidden sm:table-cell">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => {
                    const expired = new Date() > new Date(item.expiresAt);
                    const status = item.used
                      ? 'Used'
                      : expired
                        ? 'Expired'
                        : 'Active';
                    return (
                      <tr key={item._id} className="border-b">
                        <td className="px-4 py-2 text-sm">
                          <Badge variant={item.role === 'admin' ? 'default' : 'secondary'}>
                            {item.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <Badge
                            variant={
                              status === 'Active'
                                ? 'default'
                                : status === 'Used'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                          >
                            {status}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 text-sm text-muted-foreground hidden sm:table-cell">
                          {item.usedByName || '—'}
                        </td>
                        <td className="px-4 py-2 text-sm text-muted-foreground hidden sm:table-cell">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
