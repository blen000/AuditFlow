import { AuditeeResponseForm } from '@/components/audit/AuditeeResponseForm';
import { mockFindings } from '@/lib/mock-data';
import Header from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RespondToFindingPage({ params }: { params: { id: string } }) {
  const finding = mockFindings.find((f) => f.id === params.id);

  if (!finding) {
    return <div>Finding not found</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h2 className="mb-4 text-3xl font-bold tracking-tight">
                Respond to Audit Finding
              </h2>
              <Card>
                <CardHeader>
                  <CardTitle>{finding.title}</CardTitle>
                  <CardDescription>Case No: {finding.id}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Finding Details</h3>
                    <p className="text-sm text-muted-foreground">{finding.details}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Proposed Mitigation Plan</h3>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">{finding.mitigationPlan}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div>
              <AuditeeResponseForm finding={finding} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
