'use client';

import { use } from 'react';
import { SpecialAuditReportForm } from '@/components/audit/SpecialAuditReportForm';

// Under /auditee-view/special, so the route layout already requires the Special Auditee
// View permission; the Edit Finding action is enforced by the server actions.
export default function EditSpecialAuditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <SpecialAuditReportForm auditId={id} returnHref="/auditee-view?view=special" />;
}
