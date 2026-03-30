'use client';

import { use, useState } from 'react';
import { AuditeeResponseForm } from '@/components/audit/AuditeeResponseForm';
import PageHeader from '@/components/layout/PageHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { InvolvedCasesManager } from '@/components/audit/InvolvedCasesManager';
import { AuditFinding } from '@/types';
import { initialFindings } from '@/lib/mock-data';

export default function RespondToFindingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [finding] = useState<AuditFinding | undefined>(initialFindings.find(f => f.id === id));

  if (!finding) {
    return <div>Finding not found</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader title="Respond to Audit Finding" />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>{finding.title}</CardTitle>
                  <CardDescription>Case No: {finding.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Finding Details</h3>
                    <p className="text-sm text-muted-foreground">
                      {finding.details}
                    </p>
                  </div>
                  {finding.auditCause && (
                    <div>
                      <h3 className="font-semibold">Cause of Audit</h3>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {finding.auditCause}
                      </p>
                    </div>
                  )}
                  {finding.auditEffect && (
                    <div>
                      <h3 className="font-semibold">Effect of Audit</h3>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {finding.auditEffect}
                      </p>
                    </div>
                  )}
                  {finding.involvedAmounts &&
                    finding.involvedAmounts.length > 0 && (
                      <div>
                        <h3 className="font-semibold">Amounts Involved</h3>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground">
                          {finding.involvedAmounts.map((item, index) => (
                            <li key={index}>
                              {item.name}:{' '}
                              <span className="font-medium text-foreground">
                                ETB {item.amount.toLocaleString()}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  <div>
                    <h3 className="font-semibold">Proposed Recommendation</h3>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {finding.recommendation}
                    </p>
                  </div>
                </CardContent>
              </Card>
              {finding.involvedCases && finding.involvedCases.length > 0 && (
                <InvolvedCasesManager finding={finding} />
              )}
            </div>
          </div>
          <div>
            <AuditeeResponseForm finding={finding} />
          </div>
        </div>
      </main>
    </div>
  );
}
