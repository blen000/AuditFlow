'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, ChevronsDownUp, ChevronsUpDown, History, UserRound } from 'lucide-react';
import type { AuditFinding } from '@/types';

export const UNSPECIFIED_AREA = 'Unspecified Auditable Area';
const UNASSIGNED_AUDITOR = 'Unassigned';

/** A finding as it applies to one auditor: that auditor's role on the team. */
export type AuditorFinding = { finding: AuditFinding; isLeader: boolean };

export type AuditorGroup = { name: string; items: AuditorFinding[] };

export type AuditableAreaGroup = {
  area: string;
  findingCount: number;
  auditors: AuditorGroup[];
};

/** The leader first, then each distinct member (a leader also listed as a member appears once). */
export function teamOf(finding: AuditFinding): { name: string; isLeader: boolean }[] {
  const leader = finding.teamLeader || '';
  // teamMembers is a JSON column; not every report action normalizes it to an array.
  const rawMembers: string[] = Array.isArray(finding.teamMembers) ? finding.teamMembers : [];
  const members = Array.from(new Set(rawMembers)).filter((m) => m && m !== leader);
  const team = [
    ...(leader ? [{ name: leader, isLeader: true }] : []),
    ...members.map((name) => ({ name, isLeader: false })),
  ];
  return team.length > 0 ? team : [{ name: UNASSIGNED_AUDITOR, isLeader: false }];
}

/**
 * Groups findings by Auditable Area (the finding's branch/department/district label),
 * then by auditor. A finding appears under every auditor on its team, so each
 * auditor's block lists exactly the findings they worked on in that area.
 * Pass `onlyAuditor` to keep just that auditor's blocks.
 */
export function groupByAuditableArea(findings: AuditFinding[], onlyAuditor?: string): AuditableAreaGroup[] {
  const areas = new Map<string, { findingIds: Set<string>; auditors: Map<string, AuditorFinding[]> }>();

  for (const finding of findings) {
    const area = finding.branchOrDepartment?.trim() || UNSPECIFIED_AREA;
    const team = teamOf(finding).filter((m) => !onlyAuditor || m.name === onlyAuditor);
    if (team.length === 0) continue;

    let group = areas.get(area);
    if (!group) {
      group = { findingIds: new Set(), auditors: new Map() };
      areas.set(area, group);
    }
    group.findingIds.add(finding.id);
    for (const member of team) {
      const items = group.auditors.get(member.name) || [];
      items.push({ finding, isLeader: member.isLeader });
      group.auditors.set(member.name, items);
    }
  }

  return Array.from(areas.entries())
    .map(([area, group]) => ({
      area,
      findingCount: group.findingIds.size,
      auditors: Array.from(group.auditors.entries())
        .map(([name, items]) => ({ name, items }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    // Named areas alphabetically; findings with no area recorded go last.
    .sort((a, b) =>
      a.area === UNSPECIFIED_AREA ? 1 : b.area === UNSPECIFIED_AREA ? -1 : a.area.localeCompare(b.area)
    );
}

type Props = {
  findings: AuditFinding[];
  onlyAuditor?: string;
  emptyMessage: string;
  /** Renders one auditor's findings within an area (typically a table). */
  renderAuditorFindings: (items: AuditorFinding[], auditorName: string) => ReactNode;
};

export function AuditableAreaAccordion({ findings, onlyAuditor, emptyMessage, renderAuditorFindings }: Props) {
  const groups = useMemo(() => groupByAuditableArea(findings, onlyAuditor), [findings, onlyAuditor]);
  const [openAreas, setOpenAreas] = useState<string[]>([]);

  if (groups.length === 0) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border text-muted-foreground">
        <History className="h-8 w-8 opacity-20" />
        <p className="font-medium">{emptyMessage}</p>
      </div>
    );
  }

  const allOpen = openAreas.length === groups.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {groups.length} Auditable {groups.length === 1 ? 'Area' : 'Areas'}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 text-xs"
          onClick={() => setOpenAreas(allOpen ? [] : groups.map((g) => g.area))}
        >
          {allOpen ? <ChevronsDownUp className="mr-1 h-3.5 w-3.5" /> : <ChevronsUpDown className="mr-1 h-3.5 w-3.5" />}
          {allOpen ? 'Collapse all' : 'Expand all'}
        </Button>
      </div>

      <Accordion type="multiple" value={openAreas} onValueChange={setOpenAreas} className="space-y-3">
        {groups.map((group) => (
          <AccordionItem key={group.area} value={group.area} className="rounded-xl border bg-card shadow-sm">
            <AccordionTrigger className="px-5 py-4 hover:no-underline">
              <div className="flex flex-1 flex-wrap items-center gap-3 text-left">
                <Building2 className="h-4 w-4 shrink-0 text-primary" />
                <span className={group.area === UNSPECIFIED_AREA ? 'font-bold italic text-muted-foreground' : 'font-bold'}>
                  {group.area}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {group.findingCount} {group.findingCount === 1 ? 'finding' : 'findings'}
                </Badge>
                <Badge variant="outline" className="text-[10px]">
                  {group.auditors.length} {group.auditors.length === 1 ? 'auditor' : 'auditors'}
                </Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-5 px-5 pb-5">
              {group.auditors.map((auditor) => (
                <div key={auditor.name} className="space-y-2">
                  <div className="flex items-center gap-2 border-l-4 border-primary pl-3">
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-bold">{auditor.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {auditor.items.length} {auditor.items.length === 1 ? 'finding' : 'findings'}
                    </span>
                  </div>
                  {renderAuditorFindings(auditor.items, auditor.name)}
                </div>
              ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
