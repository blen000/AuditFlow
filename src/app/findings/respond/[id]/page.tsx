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
import { securePrisma } from '@/lib/securePrisma';
import { getUserFromCookiesServer } from '@/lib/serverAuth';
import { withAdminPermissions } from '@/lib/permissions';
import type { AuditFinding } from '@/types';
import { notFound, redirect } from 'next/navigation';

type Params = { id: string };

export default async function RespondToFindingPage({ params }: { params: Params }) {
  const id = params.id;
  
  // enforce server-side auth
  const currentUser = await getUserFromCookiesServer();
  if (!currentUser) {
    redirect('/login?callbackUrl=' + encodeURIComponent(`/findings/respond/${id}`));
  }

  // Require the Auditee View "Auditee Response" permission (Admins bypass).
  const effectivePermissions = withAdminPermissions(
    currentUser.role?.name,
    currentUser.role?.permissions ?? []
  );
  if (
    currentUser.role?.name !== 'Admin' &&
    !effectivePermissions.includes('auditee_view_auditee_response')
  ) {
    notFound();
  }

  // ❗ Use securePrisma to enforce object-level authorization (IDOR protection)
  const finding = await securePrisma.finding.findUnique({ where: { id } });

  if (!finding) {
    // If not found or access denied (securePrisma returns null if scoped query fails), 
    // we return 404 to avoid leaking existence of findings user can't see.
    notFound();
  }

  // Make sure the object is serializable for client components
  const serializableFinding: AuditFinding = JSON.parse(JSON.stringify(finding));

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader title="Respond to Audit Finding" backHref="/auditee-view" />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>{serializableFinding.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Finding Details</h3>
                    <p className="text-sm text-muted-foreground">
                      {serializableFinding.details}
                    </p>
                  </div>
                  {serializableFinding.auditCause && (
                    <div>
                      <h3 className="font-semibold">Cause of Audit</h3>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {serializableFinding.auditCause}
                      </p>
                    </div>
                  )}
                  {serializableFinding.auditEffect && (
                    <div>
                      <h3 className="font-semibold">Effect of Audit</h3>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {serializableFinding.auditEffect}
                      </p>
                    </div>
                  )}
                  {serializableFinding.involvedAmounts &&
                    serializableFinding.involvedAmounts.length > 0 && (
                      <div>
                        <h3 className="font-semibold">Amounts Involved</h3>
                        <ul className="list-disc pl-5 text-sm text-muted-foreground">
                          {serializableFinding.involvedAmounts.map((item, index) => (
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
                      {serializableFinding.recommendation}
                    </p>
                  </div>
                </CardContent>
              </Card>
              {serializableFinding.involvedCases && serializableFinding.involvedCases.length > 0 && (
                <InvolvedCasesManager finding={serializableFinding} />
              )}
            </div>
          </div>
          <div>
            <AuditeeResponseForm finding={serializableFinding} />
          </div>
        </div>
      </main>
    </div>
  );
}
