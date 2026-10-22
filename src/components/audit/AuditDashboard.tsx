'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import type { AuditFinding, SpecialAudit, AuditTypeCategory, AuditHierarchyNode, Branch } from '@/types';
import { DashboardStats } from './DashboardStats';
import { DashboardCharts } from './DashboardCharts';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, Calendar, Building2, Layers, FilterX, Loader2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDashboardData } from '@/app/actions/dashboard';
import { processRectificationDeadlines } from '@/app/actions/notifications/actions';
import { DateRangeFilter } from './DateRangeFilter';
import { isInSelectedPeriod, type DateRange } from '@/lib/period';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const auditTypes: AuditTypeCategory[] = ['Branch', 'District', 'Division', 'Department', 'Chief', 'CEO', 'Board'];

export default function AuditDashboard() {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [findings, setFindings] = useState<AuditFinding[]>([]);
  const [specialAudits, setSpecialAudits] = useState<SpecialAudit[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [hierarchy, setHierarchy] = useState<AuditHierarchyNode[]>([]);
  const [followUpStatuses, setFollowUpStatuses] = useState<{ id?: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Filter States
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [customRange, setCustomRange] = useState<DateRange>({});

  useEffect(() => {
    async function loadData() {
      try {
        // ❗ Trigger rectification deadline processing on dashboard load
        // In a production environment, this should be a cron job.
        await processRectificationDeadlines();

        const data = await getDashboardData();
        setFindings(data.findings as any);
        setSpecialAudits(data.specialAudits as any);
        setBranches(data.branches as any);
        setHierarchy(data.hierarchy as any);
        setFollowUpStatuses(data.followUpStatuses as any || []);
      } catch (error: any) {
        if (error.message === 'NEXT_REDIRECT') {
          // Let Next.js handle the redirect
          return;
        }
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const inSelectedPeriod = (value: Date | string | null | undefined) =>
    isInSelectedPeriod(value, selectedPeriod, customRange);

  const filteredFindings = useMemo(() => {
    return findings.filter(f => {
      const branchMatch = selectedBranch === 'all' || f.branchOrDepartment === selectedBranch;
      const typeMatch = selectedType === 'all' || f.auditType === selectedType;
      const periodMatch = inSelectedPeriod(f.findingDate || f.assignedDate || (f as any).createdAt);
      return branchMatch && typeMatch && periodMatch;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [findings, selectedBranch, selectedType, selectedPeriod, customRange]);

  const filteredSpecialAudits = useMemo(() => {
    return specialAudits.filter(a => inSelectedPeriod(a.dateCreated));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [specialAudits, selectedPeriod, customRange]);

  const handleExportPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#f8fafc', // match the background color
        windowWidth: dashboardRef.current.scrollWidth,
        windowHeight: dashboardRef.current.scrollHeight,
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight, undefined, 'FAST');
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`Audit-Dashboard-Report-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Dashboard Export Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const clearFilters = () => {
    setSelectedBranch('all');
    setSelectedType('all');
    setSelectedPeriod('all');
    setCustomRange({});
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground font-medium">Synchronizing with audit database...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Filters */}
      <Card className="bg-card border-none shadow-sm overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary shrink-0 mr-2">
              <Filter className="h-4 w-4" />
              <span>Executive Filters</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              <div className="relative">
                <Building2 className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                  <SelectTrigger className="pl-9 h-9 bg-muted/30 border-none">
                    <SelectValue placeholder="Branch / Department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Branches</SelectItem>
                    {branches.map(b => <SelectItem key={b.id} value={b.name}>{b.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <Layers className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="pl-9 h-9 bg-muted/30 border-none">
                    <SelectValue placeholder="Audit Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {auditTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground z-10" />
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="pl-9 h-9 bg-muted/30 border-none">
                    <SelectValue placeholder="Audit Period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Lifetime</SelectItem>
                    <SelectItem value="1m">Last Month</SelectItem>
                    <SelectItem value="3m">Last 3 Months</SelectItem>
                    <SelectItem value="6m">Last 6 Months</SelectItem>
                    <SelectItem value="1y">Last Year</SelectItem>
                    <SelectItem value="custom">Custom Date Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportPDF} 
                disabled={isExporting}
                className="h-9 font-bold text-primary border-primary/20"
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="mr-2 h-4 w-4" />
                )}
                Export PDF
              </Button>

              {(selectedBranch !== 'all' || selectedType !== 'all' || selectedPeriod !== 'all') && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 font-bold text-muted-foreground">
                  <FilterX className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              )}
            </div>
          </div>
          {selectedPeriod === 'custom' && (
            <DateRangeFilter value={customRange} onChange={setCustomRange} className="mt-4 border-t pt-4" />
          )}
        </CardContent>
      </Card>

      <div ref={dashboardRef} className="space-y-8 p-1">
        {/* 1. Statistics Row */}
        <DashboardStats findings={filteredFindings} specialAudits={filteredSpecialAudits} />

        {/* 2. Charts Row */}
        <DashboardCharts findings={filteredFindings} specialAudits={filteredSpecialAudits} hierarchy={hierarchy} selectedPeriod={selectedPeriod} followUpStatuses={followUpStatuses} />
      </div>
      
      <div className="rounded-lg border bg-muted/30 p-8 text-center border-dashed border-primary/20">
        <p className="text-muted-foreground text-sm">
          Detailed case management, individual branch findings, and frequency analysis are available in the 
          <a href="/reports" className="ml-1 font-bold text-primary hover:underline">Audit Reports Hub</a>.
        </p>
      </div>
    </div>
  );
}
