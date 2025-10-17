'use client';

import { useState } from 'react';
import type { AuditFinding, InvolvedCase } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';
import { CheckCircle, Circle } from 'lucide-react';

type InvolvedCasesManagerProps = {
  finding: AuditFinding;
  onUpdateCases?: (updatedCases: InvolvedCase[]) => void;
};

export function InvolvedCasesManager({ finding, onUpdateCases }: InvolvedCasesManagerProps) {
  const [cases, setCases] = useState<InvolvedCase[]>(finding.involvedCases || []);

  const handleToggleStatus = (caseId: string) => {
    const updatedCases = cases.map(c => 
      c.id === caseId ? { ...c, status: c.status === 'Open' ? 'Resolved' : 'Open' } : c
    );
    setCases(updatedCases);
    onUpdateCases?.(updatedCases);
    // In a real app, this would trigger a server action to update the DB
    console.log('Updated cases:', updatedCases);
  };

  const handleCloseAll = () => {
     const updatedCases = cases.map(c => ({...c, status: 'Resolved' as const}));
     setCases(updatedCases);
     onUpdateCases?.(updatedCases);
     console.log('Closed all cases:', updatedCases);
  }

  const allResolved = cases.every(c => c.status === 'Resolved');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Involved Cases</CardTitle>
        <CardDescription>Manage the resolution status of individual cases related to this finding.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {cases.map(c => (
            <div key={c.id} className="flex items-center justify-between rounded-md border p-3">
              <div className="flex items-center gap-3">
                 <Badge
                  variant={c.status === 'Resolved' ? 'default' : 'secondary'}
                  className={cn(c.status === 'Resolved' && 'bg-green-600 hover:bg-green-600')}
                >
                  {c.status}
                </Badge>
                <p className="font-medium">{c.ownerName}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => handleToggleStatus(c.id)}>
                {c.status === 'Open' ? 
                  <><Circle className="mr-2 h-4 w-4" /> Mark as Resolved</> : 
                  <><CheckCircle className="mr-2 h-4 w-4 text-green-600" /> Re-open</>
                }
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter className="justify-end">
        <Button onClick={handleCloseAll} disabled={allResolved}>
          Close All Cases
        </Button>
      </CardFooter>
    </Card>
  );
}
