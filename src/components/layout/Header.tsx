import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 shadow-sm md:px-6">
      <Link href="/" className="flex items-center gap-3">
        <ShieldCheck className="h-7 w-7 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          AuditFlow
        </h1>
      </Link>
      <nav className="flex items-center gap-4">
        <Button variant="outline" asChild>
          <Link href="/branches">Manage Branches</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/auditee-view">Auditee View</Link>
        </Button>
      </nav>
    </header>
  );
}
