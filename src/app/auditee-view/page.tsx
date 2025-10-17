'use client';
import { useState } from 'react';
import Header from '@/components/layout/Header';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { branches } from '@/lib/branches';
import { mockFindings } from '@/lib/mock-data';
import type { AuditFinding } from '@/types';
import { AuditFindingCard } from '@/components/audit/AuditFindingCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuditeeViewPage() {
  const [findings, setFindings] = useState<AuditFinding[]>(mockFindings);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    setFindings((prev) => prev.filter((f) => f.id !== id));
  };

  const handleUpdate = (id: string, updates: Partial<AuditFinding>) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const filteredFindings = selectedBranch
    ? findings.filter((finding) => finding.branchOrDepartment === selectedBranch)
    : [];

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Auditee Response View
              </h2>
              <p className="text-muted-foreground">
                Select your branch/department to view and respond to findings.
              </p>
            </div>
            <div className="w-full md:w-64">
              <Select onValueChange={setSelectedBranch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a branch/department" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedBranch && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Findings for {selectedBranch}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredFindings.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredFindings.map((finding) => (
                      <AuditFindingCard
                        key={finding.id}
                        finding={finding}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-muted-foreground">
                    No findings for this branch/department.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
