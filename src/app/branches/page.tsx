import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { branches } from '@/lib/branches';
import { PlusCircle } from 'lucide-react';

export default function BranchesPage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Branches & Departments
              </h2>
              <p className="text-muted-foreground">
                View and manage your organization's branches and departments.
              </p>
            </div>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Branch/Department List</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {branches.map((branch) => (
                  <li key={branch} className="flex items-center justify-between p-4">
                    <span className="font-medium">{branch}</span>
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
