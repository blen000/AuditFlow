'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Eye,
  FilterX,
  Handshake,
  Loader2,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  Repeat,
  Search,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AgreementBadge } from '@/components/audit/AgreementBadge';
import { ViewSpecialAuditDialog } from '@/components/audit/ViewSpecialAuditDialog';
import { FollowUpDialog } from '@/components/audit/FollowUpDialog';
import { AddProgressUpdateDialog } from '@/components/audit/AddProgressUpdateDialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { deleteSpecialAudit, getSpecialAuditeeViewData, updateSpecialAuditCase } from '@/app/actions/special-audits';
import { DateRangeFilter } from '@/components/audit/DateRangeFilter';
import { isInDateRange, type DateRange } from '@/lib/period';
import type { SpecialAudit } from '@/types';

type StatusOption = { id?: string; name: string };

/**
 * Special Auditee View: special audit cases only. Kept separate from the normal
 * Auditee View so regular findings and special audit cases are never mixed. The
 * server actions it calls enforce the Special Auditee View permission; the
 * permission checks here only decide which controls to render.
 */
export function SpecialAuditeeView() {
  const { toast } = useToast();
  const { permissions } = useAuth();
  const can = (key: string) => permissions.includes(key);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [audits, setAudits] = useState<SpecialAudit[]>([]);
  const [statuses, setStatuses] = useState<StatusOption[]>([]);
  const [followUpStatuses, setFollowUpStatuses] = useState<StatusOption[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange>({});

  const [viewing, setViewing] = useState<SpecialAudit | null>(null);
  const [followUpTarget, setFollowUpTarget] = useState<SpecialAudit | null>(null);
  const [progressTarget, setProgressTarget] = useState<SpecialAudit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SpecialAudit | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getSpecialAuditeeViewData();
        setAudits(data.audits as any);
        setStatuses(data.statuses as any);
        setFollowUpStatuses(data.followUpStatuses as any);
      } catch (error: any) {
        if (error?.message === 'NEXT_REDIRECT') return;
        console.error('Error loading special auditee view data:', error);
        setLoadError('Special audit cases could not be loaded. You may not have access to this view, or the server is unavailable.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(audits.map((a) => a.category).filter(Boolean) as string[])).sort(),
    [audits]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return audits.filter((a) => {
      const searchMatch =
        q === '' ||
        a.id.toLowerCase().includes(q) ||
        (a.shortSummary || '').toLowerCase().includes(q) ||
        (a.placementValue || '').toLowerCase().includes(q);
      const categoryMatch = categoryFilter === 'all' || a.category === categoryFilter;
      const statusMatch = statusFilter === 'all' || a.status === statusFilter;
      const dateMatch = isInDateRange(a.dateCreated, dateRange);
      return searchMatch && categoryMatch && statusMatch && dateMatch;
    });
  }, [audits, searchQuery, categoryFilter, statusFilter, dateRange]);

  const hasActiveFilters = searchQuery !== '' || categoryFilter !== 'all' || statusFilter !== 'all' || !!dateRange.from || !!dateRange.to;
  const clearFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setDateRange({});
  };

  const patchAudit = (id: string, updates: Partial<SpecialAudit>) =>
    setAudits((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));

  const handleChangeStatus = async (audit: SpecialAudit, status: string) => {
    const result = await updateSpecialAuditCase(audit.id, { status }, 'status');
    if (result.success) {
      patchAudit(audit.id, { status });
      toast({ title: 'Status updated', description: `Workflow status set to ${status}.` });
    } else {
      toast({ variant: 'destructive', title: 'Update failed', description: result.error });
    }
  };

  // Same signature the normal Auditee View's FollowUpDialog expects.
  const handleFollowUpUpdate = async (id: string, updates: any) => {
    const result = await updateSpecialAuditCase(id, updates, 'follow_up');
    if (!result.success) {
      toast({ variant: 'destructive', title: 'Update failed', description: result.error });
      throw new Error(result.error);
    }
    patchAudit(id, updates);
    toast({ title: 'Follow-up saved' });
  };

  const handleAddProgress = async (audit: SpecialAudit, update: { details: string }) => {
    const next = [
      ...(Array.isArray(audit.progressUpdates) ? audit.progressUpdates : []),
      { id: `PROG-${Date.now()}`, date: new Date().toISOString(), details: update.details },
    ];
    const result = await updateSpecialAuditCase(audit.id, { progressUpdates: next }, 'progress');
    if (result.success) {
      patchAudit(audit.id, { progressUpdates: next });
      toast({ title: 'Progress update added' });
    } else {
      toast({ variant: 'destructive', title: 'Update failed', description: result.error });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const result = await deleteSpecialAudit(deleteTarget.id);
      if (result.success) {
        setAudits((prev) => prev.filter((a) => a.id !== deleteTarget.id));
        toast({ title: 'Case deleted', description: 'The special audit case was removed.' });
        setDeleteTarget(null);
      } else {
        toast({ variant: 'destructive', title: 'Delete failed', description: result.error });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Delete failed', description: 'You may not have permission to delete this case.' });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Loading Special Audit Cases...</p>
      </div>
    );
  }

  const hasActions =
    can('auditee_special_edit_finding') ||
    can('auditee_special_follow_up') ||
    can('auditee_special_auditee_response') ||
    can('auditee_special_add_progress') ||
    can('auditee_special_change_status') ||
    can('auditee_special_delete');

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-4 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search case ID, summary or location..."
            className="bg-background pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="bg-background lg:w-56">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="bg-background lg:w-56">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s.id ?? s.name} value={s.name}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <DateRangeFilter value={dateRange} onChange={setDateRange} label="Report Date" />
        {hasActiveFilters && (
          <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0 text-muted-foreground" title="Reset all filters">
            <FilterX className="h-5 w-5" />
          </Button>
        )}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((audit) => (
            <Card key={audit.id} className="flex flex-col">
              <CardHeader className="space-y-3 pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {audit.id} · {format(new Date(audit.dateCreated), 'dd/MM/yyyy')}
                    </p>
                    <CardTitle className="text-base leading-snug">{audit.shortSummary}</CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => setViewing(audit)}>
                        <Eye className="mr-2 h-4 w-4" /> View Report
                      </DropdownMenuItem>
                      {can('auditee_special_edit_finding') && (
                        <DropdownMenuItem asChild>
                          <Link href={`/auditee-view/special/edit/${audit.id}`}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Finding
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {can('auditee_special_follow_up') && (
                        <DropdownMenuItem onClick={() => setFollowUpTarget(audit)}>
                          <Repeat className="mr-2 h-4 w-4" /> Follow-up
                        </DropdownMenuItem>
                      )}
                      {can('auditee_special_auditee_response') && (
                        <DropdownMenuItem asChild>
                          <Link href={`/auditee-view/special/respond/${audit.id}`}>
                            <Handshake className="mr-2 h-4 w-4" /> Auditee Response
                          </Link>
                        </DropdownMenuItem>
                      )}
                      {can('auditee_special_add_progress') && (
                        <DropdownMenuItem onClick={() => setProgressTarget(audit)}>
                          <PlusCircle className="mr-2 h-4 w-4" /> Add Progress
                        </DropdownMenuItem>
                      )}
                      {can('auditee_special_change_status') && (
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {statuses.map((status) => (
                              <DropdownMenuItem
                                key={status.id ?? status.name}
                                onClick={() => handleChangeStatus(audit, status.name)}
                                disabled={audit.status === status.name}
                              >
                                {status.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                      )}
                      {can('auditee_special_delete') && (
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(audit)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {audit.category && <Badge variant="secondary">{audit.category}</Badge>}
                  {audit.status && <Badge variant="outline">{audit.status}</Badge>}
                  {audit.followUpStatus && <Badge variant="outline">Follow-up: {audit.followUpStatus}</Badge>}
                  <AgreementBadge agreement={audit.auditeeAgreement || 'Pending'} />
                </div>
              </CardHeader>
              <CardContent className="flex-1 space-y-3 text-sm">
                <p className="line-clamp-3 text-muted-foreground">{audit.gapWitnessed}</p>
                <dl className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <dt className="font-bold uppercase text-muted-foreground">Incurred</dt>
                    <dd className="font-semibold">ETB {audit.amountInvolved.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase text-muted-foreground">Recovered</dt>
                    <dd className="font-semibold text-green-700">ETB {audit.recovered.toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="font-bold uppercase text-muted-foreground">Pending</dt>
                    <dd className="font-semibold text-destructive">ETB {audit.pending.toLocaleString()}</dd>
                  </div>
                </dl>
                <p className="text-xs text-muted-foreground">
                  Location: <span className="font-medium text-foreground">{audit.placementValue}</span>
                </p>
                {audit.mitigationDueDate && (
                  <p className="text-xs text-muted-foreground">
                    Mitigation due:{' '}
                    <span className="font-medium text-foreground">
                      {format(new Date(audit.mitigationDueDate), 'dd/MM/yyyy')}
                    </span>
                  </p>
                )}
                {Array.isArray(audit.progressUpdates) && audit.progressUpdates.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Latest progress:{' '}
                    <span className="text-foreground">
                      {audit.progressUpdates[audit.progressUpdates.length - 1].details}
                    </span>
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="py-24 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <ShieldAlert className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold">{loadError ? 'Unable to load special audits' : 'No special audit cases found'}</h3>
          <p className="text-muted-foreground">
            {loadError ??
              (hasActiveFilters
                ? 'No cases match the current filters.'
                : 'Special audit cases will appear here once they are logged.')}
          </p>
          {!loadError && !hasActions && audits.length > 0 && (
            <p className="mt-2 text-sm text-muted-foreground">Your role has view-only access to special audit cases.</p>
          )}
        </div>
      )}

      <ViewSpecialAuditDialog
        open={viewing !== null}
        onOpenChange={(open) => !open && setViewing(null)}
        audit={viewing}
      />

      {followUpTarget && (
        <FollowUpDialog
          key={followUpTarget.id}
          open
          onOpenChange={(open) => !open && setFollowUpTarget(null)}
          finding={{ ...followUpTarget, branchOrDepartment: followUpTarget.placementValue } as any}
          followUpStatuses={followUpStatuses as any}
          onUpdate={handleFollowUpUpdate}
        />
      )}

      <AlertDialog open={deleteTarget !== null} onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this special audit case?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.shortSummary} ({deleteTarget?.id}) will be permanently removed, including its follow-up and response history. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {progressTarget && (
        <AddProgressUpdateDialog
          key={progressTarget.id}
          open
          onOpenChange={(open) => !open && setProgressTarget(null)}
          onSubmit={(update) => handleAddProgress(progressTarget, update)}
          findingId={progressTarget.id}
          allowAttachment={false}
        />
      )}
    </div>
  );
}
