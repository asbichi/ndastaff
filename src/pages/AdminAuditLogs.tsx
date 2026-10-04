import React, { useState, useEffect } from 'react';
import { 
  collection, query, orderBy, getDocs, serverTimestamp, addDoc, limit 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldAlert, ShieldCheck, FileText, Search, Download, 
  RefreshCcw, UserCheck, DollarSign, Award, Calendar, Loader2, Filter 
} from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export interface AuditLogItem {
  id: string;
  action: string;
  category: 'Grade' | 'Finance' | 'Auth' | 'Staff' | 'System';
  actor: string;
  role: string;
  details: string;
  timestamp: any;
  severity: 'info' | 'warning' | 'critical';
}

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  // Seed initial sample logs if empty or fetch from Firestore
  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(100));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // Seed initial sample audit logs
        const sampleLogs = [
          {
            action: 'GRADE_MODIFICATION',
            category: 'Grade',
            actor: 'Mal Idris A. Umaru',
            role: 'Principal',
            details: 'Modified Continuous Assessment (CA) score for Aisha Bello (NDA/23/001) in Mathematics from 18 to 22.',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            severity: 'warning'
          },
          {
            action: 'FINANCIAL_RECORD_UPDATE',
            category: 'Finance',
            actor: 'Mrs. Rebecca Audu',
            role: 'Bursar',
            details: 'Recorded School Fees payment of ₦45,000 for Chukwuemeka Obi (NDA/23/002) via Bank Transfer.',
            timestamp: new Date(Date.now() - 1000 * 60 * 120),
            severity: 'info'
          },
          {
            action: 'USER_LOGIN_SUCCESS',
            category: 'Auth',
            actor: 'Mal. Usman Bichi',
            role: 'ICT Coordinator',
            details: 'Successful administrator login from IP 197.210.44.12 (Chrome / Windows).',
            timestamp: new Date(Date.now() - 1000 * 60 * 240),
            severity: 'info'
          },
          {
            action: 'STAFF_RECORD_UPDATE',
            category: 'Staff',
            actor: 'Super Administrator',
            role: 'System Admin',
            details: 'Updated department and subject assignments for Mr. Haruna Danladi (NDA/STF/003).',
            timestamp: new Date(Date.now() - 1000 * 60 * 400),
            severity: 'info'
          },
          {
            action: 'ATTENDANCE_REGISTER_SUBMISSION',
            category: 'System',
            actor: 'Mrs. Fatima Garba',
            role: 'Form Teacher',
            details: 'Submitted daily attendance register for JSS 3 Arm A (40 students present, 2 absent).',
            timestamp: new Date(Date.now() - 1000 * 60 * 600),
            severity: 'info'
          },
          {
            action: 'BULK_RESULT_PUBLISH',
            category: 'Grade',
            actor: 'Mal Idris A. Umaru',
            role: 'Principal',
            details: 'Approved and published First Term 2025/2026 Examination Results for SS 3 Science class.',
            timestamp: new Date(Date.now() - 1000 * 60 * 1440),
            severity: 'critical'
          }
        ];

        for (const log of sampleLogs) {
          await addDoc(collection(db, 'audit_logs'), {
            ...log,
            timestamp: serverTimestamp()
          });
        }

        // Re-fetch
        const freshSnap = await getDocs(query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc')));
        const freshList: AuditLogItem[] = [];
        freshSnap.forEach(d => {
          freshList.push({ id: d.id, ...d.data() } as AuditLogItem);
        });
        setLogs(freshList);
      } else {
        const list: AuditLogItem[] = [];
        snapshot.forEach(d => {
          list.push({ id: d.id, ...d.data() } as AuditLogItem);
        });
        setLogs(list);
      }
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Failed to load audit logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleExportExcel = () => {
    try {
      const dataToExport = filteredLogs.map(l => ({
        'Timestamp': l.timestamp?.toDate ? l.timestamp.toDate().toLocaleString() : new Date().toLocaleString(),
        'Action': l.action,
        'Category': l.category,
        'Actor': l.actor,
        'Role': l.role,
        'Severity': l.severity,
        'Details': l.details
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
      XLSX.writeFile(workbook, `NDA_Audit_Logs_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Audit logs exported to Excel successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export audit logs.");
    }
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = 
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || l.category.toLowerCase() === categoryFilter.toLowerCase();
    const matchesSeverity = severityFilter === 'all' || l.severity === severityFilter;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const criticalCount = logs.filter(l => l.severity === 'critical').length;
  const warningCount = logs.filter(l => l.severity === 'warning').length;
  const financeCount = logs.filter(l => l.category === 'Finance').length;
  const gradeCount = logs.filter(l => l.category === 'Grade').length;

  return (
    <div className="p-6 md:p-12 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary tracking-tight flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-blue-600" />
            Administrative Audit Logs & Accountability
          </h1>
          <p className="text-slate-500 mt-1 font-light">
            Real-time tracking of critical administrative actions, grade modifications, financial updates, and user logins.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={fetchLogs}
            variant="outline"
            className="rounded-none border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold uppercase tracking-wider h-10"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Refresh Logs
          </Button>
          <Button
            onClick={handleExportExcel}
            className="rounded-none bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-wider h-10 shadow-md"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Audit Trail
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total Tracked Events</p>
          <p className="text-3xl font-serif font-bold text-primary mt-1">{logs.length}</p>
        </div>

        <div className="bg-white border border-amber-100 p-5 shadow-sm bg-amber-50/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700">Grade Modifications</p>
          <p className="text-3xl font-serif font-bold text-amber-800 mt-1">{gradeCount}</p>
        </div>

        <div className="bg-white border border-emerald-100 p-5 shadow-sm bg-emerald-50/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Financial Updates</p>
          <p className="text-3xl font-serif font-bold text-emerald-800 mt-1">{financeCount}</p>
        </div>

        <div className="bg-white border border-rose-100 p-5 shadow-sm bg-rose-50/10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-rose-700">Critical / Warning Events</p>
          <p className="text-3xl font-serif font-bold text-rose-800 mt-1">{criticalCount + warningCount}</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search by action, actor, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 rounded-none border-slate-200 text-xs bg-white"
          />
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Category:</span>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full h-9 rounded-none border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">All Categories</option>
            <option value="grade">Grade Modification</option>
            <option value="finance">Financial Record</option>
            <option value="auth">User Login / Auth</option>
            <option value="staff">Staff Management</option>
            <option value="system">System / Attendance</option>
          </select>
        </div>

        <div className="flex gap-2 items-center">
          <span className="text-[10px] font-bold uppercase text-slate-400 shrink-0">Severity:</span>
          <select 
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="w-full h-9 rounded-none border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="all">All Severities</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <h3 className="font-serif font-bold text-primary text-sm uppercase tracking-tight">Audit Trail Records ({filteredLogs.length})</h3>
          <span className="text-xs text-slate-500 font-mono">Secured Audit Database</span>
        </div>

        <div className="overflow-x-auto min-h-[400px]">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Loading audit trail...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ShieldCheck className="w-10 h-10 text-slate-300" />
              <p className="text-xs uppercase font-bold tracking-widest">No audit logs matched your query</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Action / Event</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Actor</th>
                  <th className="py-3 px-6">Severity</th>
                  <th className="py-3 px-6">Details / Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => {
                  const dateStr = log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Just now';
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-6 font-mono text-slate-500 whitespace-nowrap text-[11px]">{dateStr}</td>
                      <td className="py-3 px-6 font-bold font-mono text-primary">{log.action}</td>
                      <td className="py-3 px-6">
                        <Badge variant="outline" className="rounded-none text-[10px] font-bold uppercase tracking-wider bg-slate-50 border-slate-200">
                          {log.category}
                        </Badge>
                      </td>
                      <td className="py-3 px-6 font-semibold text-slate-800">
                        {log.actor}
                        <span className="block text-[10px] text-slate-400 font-normal">{log.role}</span>
                      </td>
                      <td className="py-3 px-6">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-none ${
                          log.severity === 'critical' ? 'bg-rose-100 text-rose-700 border border-rose-200' :
                          log.severity === 'warning' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {log.severity}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-slate-600 max-w-md leading-relaxed">{log.details}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
