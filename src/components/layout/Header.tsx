'use client';
import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Manage
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href="/branches">Branches</Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/districts">Districts</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" asChild>
          <Link href="/auditee-view">Auditee View</Link>
        </Button>
      </nav>
    </header>
  );
}
