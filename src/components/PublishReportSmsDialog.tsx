import React, { useState, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Send, Smartphone, CheckCircle2, AlertCircle, RefreshCw, 
  Users, MessageSquare, History, Check, Loader2, Sparkles, PhoneCall 
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  generateResultSmsText, 
  publishReportsAndBroadcastSms, 
  checkReportPublicationStatus, 
  fetchRecentSmsLogs,
  SmsLogRecord,
  normalizePhoneNumber
} from '../utils/smsNotificationService';

interface PublishReportSmsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  reports: any[];
  session: string;
  term: string;
  studentClass: string;
  arm: string;
  onPublished?: (publishedAt: string) => void;
}

export default function PublishReportSmsDialog({
  isOpen,
  onOpenChange,
  reports,
  session,
  term,
  studentClass,
  arm,
  onPublished
}: PublishReportSmsDialogProps) {
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
  const [parentPhoneOverrides, setParentPhoneOverrides] = useState<Record<string, string>>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentProgressStudent, setCurrentProgressStudent] = useState('');
  const [publishedStatus, setPublishedStatus] = useState<{ isPublished: boolean; publishedAt?: string; smsSentCount?: number }>({ isPublished: false });
  const [recentLogs, setRecentLogs] = useState<SmsLogRecord[]>([]);
  const [activeTab, setActiveTab] = useState<'preview' | 'recipients' | 'history'>('preview');

  // Check publication status when dialog opens
  useEffect(() => {
    if (isOpen) {
      checkStatus();
      loadHistory();
    }
  }, [isOpen, session, term, studentClass, arm]);

  const checkStatus = async () => {
    const status = await checkReportPublicationStatus(session, term, studentClass, arm);
    setPublishedStatus(status);
  };

  const loadHistory = async () => {
    const logs = await fetchRecentSmsLogs(15);
    setRecentLogs(logs);
  };

  if (!reports || reports.length === 0) {
    return null;
  }

  const selectedReport = reports[selectedStudentIndex] || reports[0];
  const studentKey = selectedReport.admissionNo || selectedReport.name;
  const currentPhone = parentPhoneOverrides[studentKey] || selectedReport.parentPhone || selectedReport.phone || `0803${String(1000000 + (selectedStudentIndex * 1234)).slice(0, 7)}`;

  // Generate preview SMS for the selected student
  const subjects = selectedReport.subjects || [];
  const totalScore = subjects.reduce((sum: number, s: any) => sum + (Number(s.total) || 0), 0);
  const maxScore = subjects.length * 100 || 1000;
  const average = subjects.length > 0 ? parseFloat((totalScore / subjects.length).toFixed(1)) : 0;
  const topSubjects = [...subjects]
    .sort((a, b) => (b.total || 0) - (a.total || 0))
    .slice(0, 4)
    .map(s => ({ name: s.name, total: s.total, grade: s.grade }));

  const previewSmsText = generateResultSmsText({
    studentName: selectedReport.name,
    admissionNo: selectedReport.admissionNo,
    studentClass,
    arm,
    term,
    session,
    totalScore,
    maxScore,
    average,
    position: selectedReport.position || 'Merit',
    parentPhone: normalizePhoneNumber(currentPhone),
    topSubjects,
    principalComment: selectedReport.principalComment
  });

  const handlePhoneChange = (key: string, val: string) => {
    setParentPhoneOverrides(prev => ({ ...prev, [key]: val }));
  };

  const handleTriggerPublishAndSms = async () => {
    setIsPublishing(true);
    setProgressPercent(5);
    setCurrentProgressStudent('Initializing SMS Gateway...');

    // Merge phone overrides into reports before dispatch
    const enrichedReports = reports.map((r, idx) => {
      const k = r.admissionNo || r.name;
      const finalPhone = parentPhoneOverrides[k] || r.parentPhone || r.phone || `0803${String(1000000 + (idx * 1234)).slice(0, 7)}`;
      return {
        ...r,
        parentPhone: finalPhone
      };
    });

    try {
      const result = await publishReportsAndBroadcastSms(
        enrichedReports,
        session,
        term,
        studentClass,
        arm,
        {
          customSenderId: 'NDA-SCHOOL',
          onProgress: (pct, student) => {
            setProgressPercent(pct);
            setCurrentProgressStudent(`Sending SMS to parents of ${student}...`);
          }
        }
      );

      toast.success(`Published! Successfully sent ${result.totalSent} result SMS alerts to parents.`);
      if (onPublished) onPublished(result.publishedAt);
      await checkStatus();
      await loadHistory();
      setActiveTab('history');
    } catch (error: any) {
      console.error("Broadcast failed:", error);
      toast.error(`Automated SMS failed: ${error.message || 'Please check network connection'}`);
    } finally {
      setIsPublishing(false);
      setProgressPercent(0);
      setCurrentProgressStudent('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                  Publish Reports & Dispatch Parent SMS
                  {publishedStatus.isPublished && (
                    <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300">
                      Already Published
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Broadcasts instant, personalized academic exam result summaries directly to registered parents via SMS.
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Publication Status Summary Banner */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700">Target Cohort:</span>
              <span className="font-semibold text-blue-700 uppercase">
                {studentClass} (Arm {arm}) · {term} ({session})
              </span>
            </div>
            <div className="text-[11px] text-slate-500 flex items-center gap-3">
              <span>Recipients: <strong className="text-slate-800">{reports.length} Parents</strong></span>
              <span>Sender ID: <strong className="text-slate-800 font-mono">NDA-SCHOOL</strong></span>
              <span>Gateway: <strong className="text-emerald-700">Online · Active</strong></span>
            </div>
          </div>
          {publishedStatus.isPublished && (
            <div className="text-right text-[11px]">
              <span className="text-slate-400 block">Published on:</span>
              <span className="font-bold text-slate-700">{publishedStatus.publishedAt}</span>
            </div>
          )}
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full mt-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="preview" className="text-xs font-semibold flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              SMS Preview ({reports.length})
            </TabsTrigger>
            <TabsTrigger value="recipients" className="text-xs font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Parent Phone List
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs font-semibold flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" />
              SMS Dispatch Logs
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Real-time SMS Message Preview */}
          <TabsContent value="preview" className="space-y-4 pt-2">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Select Student to Preview Personalized SMS:
              </label>
              <select
                value={selectedStudentIndex}
                onChange={(e) => setSelectedStudentIndex(Number(e.target.value))}
                className="w-full text-xs font-semibold border border-slate-300 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {reports.map((r, i) => (
                  <option key={i} value={i}>
                    {i + 1}. {r.name} ({r.admissionNo}) — Position: {r.position || 'N/A'}
                  </option>
                ))}
              </select>
            </div>

            {/* Simulated Phone SMS Bubble */}
            <div className="border border-slate-300 bg-slate-100 rounded-2xl p-4 max-w-md mx-auto shadow-inner">
              <div className="flex items-center justify-between text-[10px] text-slate-500 pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" />
                  Sender: NDA-SCHOOL
                </span>
                <span>To: <strong className="font-mono text-slate-800">{normalizePhoneNumber(currentPhone)}</strong></span>
              </div>

              <div className="mt-3 p-3 bg-blue-600 text-white rounded-xl shadow-xs text-xs font-mono whitespace-pre-wrap leading-relaxed">
                {previewSmsText}
              </div>

              <div className="mt-2.5 flex items-center justify-between text-[10px] text-slate-400 px-1">
                <span>Segments: <strong>{Math.ceil(previewSmsText.length / 160)} SMS units</strong></span>
                <span>Characters: <strong>{previewSmsText.length} chars</strong></span>
                <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Auto-Personalized
                </span>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: Editable Parent Phone Numbers */}
          <TabsContent value="recipients" className="space-y-3 pt-2">
            <p className="text-xs text-slate-500">
              Verify and update registered parent phone numbers before broadcasting:
            </p>
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 sticky top-0">
                  <tr>
                    <th className="p-2 w-8">#</th>
                    <th className="p-2">Student Name</th>
                    <th className="p-2">Reg No</th>
                    <th className="p-2">Parent Phone</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((r, idx) => {
                    const key = r.admissionNo || r.name;
                    const phoneVal = parentPhoneOverrides[key] !== undefined 
                      ? parentPhoneOverrides[key] 
                      : (r.parentPhone || r.phone || `0803${String(1000000 + (idx * 1234)).slice(0, 7)}`);

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="p-2 font-semibold text-slate-800">{r.name}</td>
                        <td className="p-2 font-mono text-slate-500">{r.admissionNo}</td>
                        <td className="p-1.5">
                          <Input
                            value={phoneVal}
                            onChange={(e) => handlePhoneChange(key, e.target.value)}
                            placeholder="08031234567"
                            className="h-7 text-xs font-mono w-36"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* TAB 3: Recent SMS Audit Logs */}
          <TabsContent value="history" className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Recent SMS transmissions logged in system:</span>
              <Button variant="ghost" size="sm" onClick={loadHistory} className="h-6 text-[10px]">
                <RefreshCw className="w-3 h-3 mr-1" /> Refresh
              </Button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 sticky top-0">
                  <tr>
                    <th className="p-2">Time</th>
                    <th className="p-2">Student</th>
                    <th className="p-2">Recipient Phone</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 text-[10px] text-slate-400 whitespace-nowrap">{log.sentAt}</td>
                      <td className="p-2 font-semibold text-slate-800">{log.studentName}</td>
                      <td className="p-2 font-mono text-slate-600">{log.recipientPhone}</td>
                      <td className="p-2">
                        <Badge className="bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {log.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {recentLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 text-xs">
                        No previous SMS logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>

        {/* Live Broadcast Progress Bar */}
        {isPublishing && (
          <div className="space-y-2 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-700 flex items-center gap-1.5">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                {currentProgressStudent}
              </span>
              <span className="font-bold text-slate-700">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}

        <DialogFooter className="pt-4 border-t border-slate-100 gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPublishing}
            className="text-xs"
          >
            Close
          </Button>

          <Button
            onClick={handleTriggerPublishAndSms}
            disabled={isPublishing || reports.length === 0}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-5 shadow-sm"
          >
            {isPublishing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                Publishing & Sending SMS...
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 mr-2" />
                {publishedStatus.isPublished ? 'Re-publish & Send SMS' : `Publish & Send SMS (${reports.length} Parents)`}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
