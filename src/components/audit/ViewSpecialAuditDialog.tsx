'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  CircleDollarSign, 
  UserPlus, 
  ShieldAlert, 
  BadgeInfo, 
  MapPin,
  Clock,
  User,
  Briefcase,
  Hash,
  Scale,
  FileDown,
  ChevronDown,
  Printer,
  Loader2
} from 'lucide-react';
import type { SpecialAudit } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ViewSpecialAuditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audit: SpecialAudit | null;
};

export function ViewSpecialAuditDialog({
  open,
  onOpenChange,
  audit,
}: ViewSpecialAuditDialogProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  if (!audit) return null;

  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();

      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }

      pdf.save(`Special-Audit-Report-${audit.id}-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportWord = () => {
    if (!reportRef.current) return;
    setIsExporting(true);
    
    try {
      const content = reportRef.current.innerHTML;
      const styles = `
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
          section { margin-bottom: 30px; }
          h1 { color: #8B5CF6; font-size: 18pt; text-align: center; text-transform: uppercase; margin-bottom: 10px; }
          h2 { font-size: 10pt; text-align: center; color: #666; margin-bottom: 20px; }
          h4 { color: #8B5CF6; font-size: 10pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-bottom: 15px; }
          .grid { display: flex; flex-wrap: wrap; gap: 20px; }
          .col { flex: 1; min-width: 200px; }
          .label { font-size: 8pt; font-weight: bold; color: #666; text-transform: uppercase; margin-bottom: 4px; }
          .value { font-size: 11pt; font-weight: bold; }
          .amount-card { padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px; }
          .person-card { padding: 10px; border: 1px solid #ddd; border-radius: 8px; margin-bottom: 10px; background-color: #f9f9f9; }
          .italic { font-style: italic; }
          .font-bold { font-weight: bold; }
        </style>
      `;

      const header = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><meta charset='utf-8'>${styles}</head><body>
        <h1>${audit.shortSummary}</h1>
        <h2>Mission Report ID: ${audit.id} • Logged on ${new Date(audit.dateCreated).toLocaleDateString()}</h2>
      `;
      const footer = "</body></html>";
      const sourceHTML = header + content + footer;
      
      const blob = new Blob(['\ufeff', sourceHTML], {
        type: 'application/msword'
      });
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Special-Audit-Report-${audit.id}-${new Date().toISOString().split('T')[0]}.doc`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Word Export Error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl gap-0 print:h-auto print:max-h-none print:shadow-none">
        <DialogHeader className="px-8 py-6 border-b shrink-0 bg-primary text-primary-foreground rounded-t-none">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black uppercase tracking-tight">
                {audit.shortSummary}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/70 font-mono text-xs uppercase tracking-widest">
                Mission Report ID: {audit.id} • Logged on {new Date(audit.dateCreated).toLocaleDateString()}
              </DialogDescription>
            </div>
            <Badge variant="outline" className="h-fit py-1 px-3 border-primary-foreground/30 text-primary-foreground font-bold">
              {audit.placement}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 bg-background print:overflow-visible">
          <div ref={reportRef} className="p-8 space-y-10 print:p-0 print:space-y-8">
            {/* Location & Summary Section */}
            <section className="space-y-4 print:break-inside-avoid">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> Placement & Scope
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Placement Detail</p>
                  <p className="text-lg font-bold">{audit.placementValue}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Placement Category</p>
                  <p className="text-lg font-bold">{audit.placement}</p>
                </div>
              </div>
            </section>

            {/* Monetary Reconciliation */}
            <section className="space-y-4 print:break-inside-avoid">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2">
                <CircleDollarSign className="h-3.5 w-3.5" /> Monetary Reconciliation
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-muted/30 p-4 rounded-xl border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Involved</p>
                  <p className="text-2xl font-bold">ETB {audit.amountInvolved.toLocaleString()}</p>
                </div>
                <div className="bg-green-500/5 p-4 rounded-xl border border-green-500/20">
                  <p className="text-[10px] font-bold text-green-600 uppercase">Recovered Amount</p>
                  <p className="text-2xl font-bold text-green-600">ETB {audit.recovered.toLocaleString()}</p>
                </div>
                <div className="bg-destructive/5 p-4 rounded-xl border border-destructive/20">
                  <p className="text-[10px] font-bold text-destructive uppercase">Pending Balance</p>
                  <p className="text-2xl font-bold text-destructive">ETB {audit.pending.toLocaleString()}</p>
                </div>
              </div>
            </section>

            {/* Involved Individuals */}
            <section className="space-y-4 print:break-inside-avoid">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5" /> Involved Personnel
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {audit.individuals.map((person, idx) => (
                  <div key={idx} className="p-4 rounded-xl border bg-muted/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-base">{person.name}</p>
                      <Badge variant="secondary" className="text-[10px]">{person.sex}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                      <div className="space-y-1">
                        <p className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> Position</p>
                        <p className="text-foreground normal-case">{person.position}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="flex items-center gap-1"><Hash className="h-3 w-3" /> Age</p>
                        <p className="text-foreground">{person.age} Years</p>
                      </div>
                      <div className="space-y-1">
                        <p className="flex items-center gap-1"><Clock className="h-3 w-3" /> Tenure</p>
                        <p className="text-foreground">{person.tenure}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Analysis & Recommendations Section */}
            <section className="space-y-6 print:break-inside-avoid">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2">
                <Scale className="h-3.5 w-3.5" /> Analysis & Recommendations
              </h4>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-widest">
                      Cause of Audit
                    </div>
                    <p className="text-sm leading-relaxed bg-muted/20 p-4 rounded-lg border italic">
                      {audit.auditCause || 'Not specified'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-widest">
                      Effect of Audit
                    </div>
                    <p className="text-sm leading-relaxed bg-muted/20 p-4 rounded-lg border italic">
                      {audit.auditEffect || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] tracking-widest">
                    Proposed Recommendation
                  </div>
                  <p className="text-sm font-bold leading-relaxed bg-primary/5 p-4 rounded-lg border border-primary/10">
                    {audit.recommendation || 'Not specified'}
                  </p>
                </div>
              </div>
            </section>

            {/* Analysis & Actions */}
            <section className="space-y-6 print:break-inside-avoid">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary border-b pb-2 flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5" /> Accountability & Corrective Measures
              </h4>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-destructive font-bold uppercase text-[10px] tracking-widest">
                    <ShieldAlert className="h-3.5 w-3.5" /> Disciplinary Action
                  </div>
                  <p className="text-sm leading-relaxed bg-destructive/5 p-4 rounded-lg border border-destructive/10">
                    {audit.actionDisciplinary}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground font-bold uppercase text-[10px] tracking-widest">
                    <BadgeInfo className="h-3.5 w-3.5" /> Control Gap Witnessed
                  </div>
                  <p className="text-sm leading-relaxed bg-muted/30 p-4 rounded-lg border">
                    {audit.gapWitnessed}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-orange-600 font-bold uppercase text-[10px] tracking-widest">
                    <BadgeInfo className="h-3.5 w-3.5" /> Corrective Action Taken
                  </div>
                  <p className="text-sm leading-relaxed bg-orange-500/5 p-4 rounded-lg border border-orange-500/10">
                    {audit.correctiveActionTaken}
                  </p>
                </div>
              </div>
            </section>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 border-t bg-muted/20 shrink-0 print:hidden flex items-center justify-between">
          <Button type="button" variant="outline" className="font-bold h-10" onClick={() => onOpenChange(false)}>
            Close Report
          </Button>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="default" 
                  className="font-bold h-10 shadow-sm"
                  disabled={isExporting}
                >
                  {isExporting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileDown className="mr-2 h-4 w-4" />
                  )}
                  Export Report
                  <ChevronDown className="ml-2 h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Export Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4 text-red-500" />
                  <span>Export as PDF</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportWord} className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4 text-blue-500" />
                  <span>Export as Word (.doc)</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => window.print()} className="cursor-pointer">
                  <Printer className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Print Document</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
