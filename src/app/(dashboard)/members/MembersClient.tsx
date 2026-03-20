'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getMembers, removeMember, type MemberData } from '@/lib/actions/member';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

export default function MembersClient() {
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [removeTarget, setRemoveTarget] = useState<{ userId: string; name: string } | null>(null);

  async function loadMembers() {
    setLoading(true);
    const data = await getMembers();
    setMembers(data);
    setLoading(false);
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function handleRemove() {
    if (!removeTarget) return;
    const result = await removeMember(removeTarget.userId);
    if (result.success) {
      setRemoveTarget(null);
      await loadMembers();
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground">
            Manage members of your mosque
          </p>
        </div>
        <Button asChild>
          <Link href="/members/invite">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : members.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No members yet. Invite someone to join!
        </div>
      ) : (
        <div className="rounded-md border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden md:table-cell">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium hidden sm:table-cell">Joined</th>
                <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member._id} className="border-b">
                  <td className="px-4 py-3 text-sm font-medium">{member.name}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                    {member.email}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                    {member.phone || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
                      {member.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                    {new Date(member.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {member.role !== 'admin' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setRemoveTarget({ userId: member.userId, name: member.name })}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove Member"
        description={removeTarget ? `Remove ${removeTarget.name} from the mosque? They will lose access.` : ''}
        confirmLabel="Remove"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
        destructive
      />
    </div>
  );
}
