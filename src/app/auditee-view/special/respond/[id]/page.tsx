import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpecialAuditResponseForm } from '@/components/audit/SpecialAuditResponseForm';
import { securePrisma } from '@/lib/securePrisma';
import { getUserFromCookiesServer } from '@/lib/serverAuth';
import { withAdminPermissions } from '@/lib/permissions';
import type { SpecialAudit } from '@/types';
import { notFound, redirect } from 'next/navigation';

export default async function RespondToSpecialAuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const currentUser = await getUserFromCookiesServer();
  if (!currentUser) {
    redirect('/login?callbackUrl=' + encodeURIComponent(`/auditee-view/special/respond/${id}`));
  }

  // Special Auditee View plus Auditee Response permission (Admins bypass). The
  // route layout already enforces the view permission; this guards the action.
  const effectivePermissions = withAdminPermissions(currentUser.role?.name, currentUser.role?.permissions ?? []);
  if (
    currentUser.role?.name !== 'Admin' &&
    !(effectivePermissions.includes('auditee_view_special') && effectivePermissions.includes('auditee_view_auditee_response'))
  ) {
    notFound();
  }

  // Scoped query: returns nothing for cases the user may not see.
  const [found] = await securePrisma.specialAudit.findMany({
    where: { id },
    include: { category: true, individuals: true },
  });
  if (!found) notFound();

  const audit: SpecialAudit = JSON.parse(JSON.stringify({ ...found, category: found.category?.name || 'Uncategorized' }));

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader title="Respond to Special Audit Case" backHref="/auditee-view?view=special" />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{audit.shortSummary}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">Gap Witnessed</h3>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{audit.gapWitnessed}</p>
                </div>
                {audit.auditCause && (
                  <div>
                    <h3 className="font-semibold">Cause of Audit</h3>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{audit.auditCause}</p>
                  </div>
                )}
                {audit.auditEffect && (
                  <div>
                    <h3 className="font-semibold">Effect of Audit</h3>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{audit.auditEffect}</p>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">Amounts Involved</h3>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground">
                    <li>Involved: <span className="font-medium text-foreground">ETB {audit.amountInvolved.toLocaleString()}</span></li>
                    <li>Recovered: <span className="font-medium text-foreground">ETB {audit.recovered.toLocaleString()}</span></li>
                    <li>Pending: <span className="font-medium text-foreground">ETB {audit.pending.toLocaleString()}</span></li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold">Corrective Action Taken</h3>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">{audit.correctiveActionTaken}</p>
                </div>
                {audit.recommendation && (
                  <div>
                    <h3 className="font-semibold">Proposed Recommendation</h3>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{audit.recommendation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          <div>
            <SpecialAuditResponseForm audit={audit} />
          </div>
        </div>
      </main>
    </div>
  );
}
