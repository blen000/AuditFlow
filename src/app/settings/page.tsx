'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { 
  Building, 
  MapPin, 
  Briefcase, 
  UserRound, 
  UserCog, 
  ShieldCheck, 
  ShieldAlert, 
  Tags,
  PlusCircle,
  MoreHorizontal,
  Edit,
  Trash2
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

// Data & Types
import { 
  initialBranches, 
  initialDistricts, 
  initialDepartments, 
  initialChiefs, 
  initialCEOs, 
  initialBoards, 
  initialRiskLevels, 
  initialStatuses 
} from '@/lib/mock-data';
import type { 
  Branch, 
  District, 
  Department, 
  Chief, 
  CEO, 
  Board, 
  RiskLevelData, 
  StatusData 
} from '@/types';

// Dialogs
import { AddEditBranchDialog } from '@/components/audit/AddEditBranchDialog';
import { AddEditDistrictDialog } from '@/components/audit/AddEditDistrictDialog';
import { AddEditDepartmentDialog } from '@/components/audit/AddEditDepartmentDialog';
import { AddEditChiefDialog } from '@/components/audit/AddEditChiefDialog';
import { AddEditCEODialog } from '@/components/audit/AddEditCEODialog';
import { AddEditBoardDialog } from '@/components/audit/AddEditBoardDialog';
import { AddEditRiskLevelDialog } from '@/components/audit/AddEditRiskLevelDialog';
import { AddEditStatusDialog } from '@/components/audit/AddEditStatusDialog';

export default function SettingsPage() {
  const { toast } = useToast();

  // States
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [districts, setDistricts] = useState<District[]>(initialDistricts);
  const [departments, setDepartments] = useState<Department[]>(initialDepartments);
  const [chiefs, setChiefs] = useState<Chief[]>(initialChiefs);
  const [ceos, setCEOs] = useState<CEO[]>(initialCEOs);
  const [boards, setBoards] = useState<Board[]>(initialBoards);
  const [riskLevels, setRiskLevels] = useState<RiskLevelData[]>(initialRiskLevels);
  const [statuses, setStatuses] = useState<StatusData[]>(initialStatuses);

  // Dialog Control State
  const [activeTab, setActiveTab] = useState('branches');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Generic Handlers
  const handleAddNew = () => {
    setEditingItem(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setDialogOpen(true);
  };

  const handleDelete = (id: string, category: string, setter: any) => {
    setter((prev: any[]) => prev.filter(item => item.id !== id));
    toast({
      title: "Item removed",
      description: `The ${category} item has been successfully deleted.`,
    });
  };

  // Submit Handlers
  const handleBranchSubmit = (data: Omit<Branch, 'id'>) => {
    if (editingItem) {
      setBranches(prev => prev.map(b => b.id === editingItem.id ? { ...b, ...data } : b));
      toast({ title: "Branch updated" });
    } else {
      setBranches(prev => [...prev, { ...data, id: `BR-${Date.now()}` }]);
      toast({ title: "Branch added" });
    }
  };

  const handleDistrictSubmit = (data: Omit<District, 'id'>) => {
    if (editingItem) {
      setDistricts(prev => prev.map(d => d.id === editingItem.id ? { ...d, ...data } : d));
      toast({ title: "District updated" });
    } else {
      setDistricts(prev => [...prev, { ...data, id: `DIST-${Date.now()}` }]);
      toast({ title: "District added" });
    }
  };

  const handleDepartmentSubmit = (data: Omit<Department, 'id'>) => {
    if (editingItem) {
      setDepartments(prev => prev.map(d => d.id === editingItem.id ? { ...d, ...data } : d));
      toast({ title: "Department updated" });
    } else {
      setDepartments(prev => [...prev, { ...data, id: `DEPT-${Date.now()}` }]);
      toast({ title: "Department added" });
    }
  };

  const handleChiefSubmit = (data: Omit<Chief, 'id'>) => {
    if (editingItem) {
      setChiefs(prev => prev.map(c => c.id === editingItem.id ? { ...c, ...data } : c));
      toast({ title: "Chief role updated" });
    } else {
      setChiefs(prev => [...prev, { ...data, id: `CHIEF-${Date.now()}` }]);
      toast({ title: "Chief role added" });
    }
  };

  const handleCEOSubmit = (data: Omit<CEO, 'id'>) => {
    if (editingItem) {
      setCEOs(prev => prev.map(c => c.id === editingItem.id ? { ...c, ...data } : c));
      toast({ title: "CEO office updated" });
    } else {
      setCEOs(prev => [...prev, { ...data, id: `CEO-${Date.now()}` }]);
      toast({ title: "CEO office added" });
    }
  };

  const handleBoardSubmit = (data: Omit<Board, 'id'>) => {
    if (editingItem) {
      setBoards(prev => prev.map(b => b.id === editingItem.id ? { ...b, ...data } : b));
      toast({ title: "Board updated" });
    } else {
      setBoards(prev => [...prev, { ...data, id: `BOARD-${Date.now()}` }]);
      toast({ title: "Board added" });
    }
  };

  const handleRiskSubmit = (data: Omit<RiskLevelData, 'id'>) => {
    if (editingItem) {
      setRiskLevels(prev => prev.map(r => r.id === editingItem.id ? { ...r, ...data } : r));
      toast({ title: "Risk Level updated" });
    } else {
      setRiskLevels(prev => [...prev, { ...data, id: `RISK-${Date.now()}` }]);
      toast({ title: "Risk Level added" });
    }
  };

  const handleStatusSubmit = (data: Omit<StatusData, 'id'>) => {
    if (editingItem) {
      setStatuses(prev => prev.map(s => s.id === editingItem.id ? { ...s, ...data } : s));
      toast({ title: "Status updated" });
    } else {
      setStatuses(prev => [...prev, { ...data, id: `STAT-${Date.now()}` }]);
      toast({ title: "Status added" });
    }
  };

  const ManagementList = ({ items, setter, category, labelKey = 'name', subKey }: { items: any[], setter: any, category: string, labelKey?: string, subKey?: string }) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold capitalize">{category} Configuration</h3>
        <Button onClick={handleAddNew} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New {category.slice(0, -1)}
        </Button>
      </div>
      <div className="rounded-md border">
        <ul className="divide-y divide-border">
          {items.length > 0 ? (
            items.map((item) => (
              <li key={item.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div>
                  <span className="font-bold text-foreground">{item[labelKey]}</span>
                  {subKey && item[subKey] && (
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                      {item[subKey]}
                    </p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(item)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive" 
                      onClick={() => handleDelete(item.id, category, setter)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            ))
          ) : (
            <li className="p-8 text-center text-muted-foreground italic">
              No {category} registered yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <PageHeader 
        title="Settings & Configuration" 
        description="Centralized portal for managing organizational structure and audit parameters." 
      />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-5xl">
          <Tabs defaultValue="branches" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="md:col-span-1 h-fit shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Directory</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <TabsList className="flex flex-col h-auto bg-transparent w-full items-stretch p-0 space-y-1">
                    <TabsTrigger value="branches" className="justify-start px-4 h-11 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-none shadow-none rounded-none">
                      <Building className="mr-3 h-4 w-4" /> Branches
                    </TabsTrigger>
                    <TabsTrigger value="districts" className="justify-start px-4 h-11 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-none shadow-none rounded-none">
                      <MapPin className="mr-3 h-4 w-4" /> Districts
                    </TabsTrigger>
                    <TabsTrigger value="departments" className="justify-start px-4 h-11 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-none shadow-none rounded-none">
                      <Briefcase className="mr-3 h-4 w-4" /> Departments
                    </TabsTrigger>
                    <TabsTrigger value="chiefs" className="justify-start px-4 h-11 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-none shadow-none rounded-none">
                      <UserRound className="mr-3 h-4 w-4" /> Chiefs
                    </TabsTrigger>
                    <TabsTrigger value="ceos" className="justify-start px-4 h-11 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-none shadow-none rounded-none">
                      <UserCog className="mr-3 h-4 w-4" /> CEOs
                    </TabsTrigger>
                    <TabsTrigger value="boards" className="justify-start px-4 h-11 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-none shadow-none rounded-none">
                      <ShieldCheck className="mr-3 h-4 w-4" /> Boards
                    </TabsTrigger>
                    <TabsTrigger value="risk-levels" className="justify-start px-4 h-11 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-none shadow-none rounded-none">
                      <ShieldAlert className="mr-3 h-4 w-4" /> Risk Levels
                    </TabsTrigger>
                    <TabsTrigger value="statuses" className="justify-start px-4 h-11 data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-none shadow-none rounded-none">
                      <Tags className="mr-3 h-4 w-4" /> Statuses
                    </TabsTrigger>
                  </TabsList>
                </CardContent>
              </Card>

              <Card className="md:col-span-3 shadow-md">
                <CardContent className="pt-6">
                  <TabsContent value="branches" className="mt-0">
                    <ManagementList items={branches} setter={setBranches} category="branches" subKey="district" />
                  </TabsContent>
                  <TabsContent value="districts" className="mt-0">
                    <ManagementList items={districts} setter={setDistricts} category="districts" />
                  </TabsContent>
                  <TabsContent value="departments" className="mt-0">
                    <ManagementList items={departments} setter={setDepartments} category="departments" />
                  </TabsContent>
                  <TabsContent value="chiefs" className="mt-0">
                    <ManagementList items={chiefs} setter={setChiefs} category="chiefs" />
                  </TabsContent>
                  <TabsContent value="ceos" className="mt-0">
                    <ManagementList items={ceos} setter={setCEOs} category="ceos" />
                  </TabsContent>
                  <TabsContent value="boards" className="mt-0">
                    <ManagementList items={boards} setter={setBoards} category="boards" />
                  </TabsContent>
                  <TabsContent value="risk-levels" className="mt-0">
                    <ManagementList items={riskLevels} setter={setRiskLevels} category="riskLevels" />
                  </TabsContent>
                  <TabsContent value="statuses" className="mt-0">
                    <ManagementList items={statuses} setter={setStatuses} category="statuses" />
                  </TabsContent>
                </CardContent>
              </Card>
            </div>
          </Tabs>
        </div>
      </main>

      {/* Unified Dialog Rendering based on Active Tab */}
      {activeTab === 'branches' && (
        <AddEditBranchDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          onSubmit={handleBranchSubmit} 
          branch={editingItem} 
          districtList={districts}
        />
      )}
      {activeTab === 'districts' && (
        <AddEditDistrictDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          onSubmit={handleDistrictSubmit} 
          district={editingItem} 
        />
      )}
      {activeTab === 'departments' && (
        <AddEditDepartmentDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          onSubmit={handleDepartmentSubmit} 
          department={editingItem} 
        />
      )}
      {activeTab === 'chiefs' && (
        <AddEditChiefDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          onSubmit={handleChiefSubmit} 
          chief={editingItem} 
        />
      )}
      {activeTab === 'ceos' && (
        <AddEditCEODialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          onSubmit={handleCEOSubmit} 
          ceo={editingItem} 
        />
      )}
      {activeTab === 'boards' && (
        <AddEditBoardDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          onSubmit={handleBoardSubmit} 
          board={editingItem} 
        />
      )}
      {activeTab === 'risk-levels' && (
        <AddEditRiskLevelDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          onSubmit={handleRiskSubmit} 
          riskLevel={editingItem} 
        />
      )}
      {activeTab === 'statuses' && (
        <AddEditStatusDialog 
          open={dialogOpen} 
          onOpenChange={setDialogOpen} 
          onSubmit={handleStatusSubmit} 
          status={editingItem} 
        />
      )}
    </div>
  );
}
