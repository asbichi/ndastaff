import React from 'react';
import { ShieldAlert, ArrowLeft, Lock, AlertTriangle, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { STANDARD_DENIAL_MESSAGE } from '../security/rbac';

interface AccessDeniedProps {
  message?: string;
  reason?: string;
  role?: string;
  attemptedSection?: string;
}

export default function AccessDenied({ 
  message = STANDARD_DENIAL_MESSAGE,
  reason,
  role,
  attemptedSection
}: AccessDeniedProps) {
  const navigate = useNavigate();
  const currentRole = role || localStorage.getItem('admin_role') || 'Unknown';

  const getAuthorizedRedirect = () => {
    if (currentRole === 'exam_officer') return '/admin/score-entry';
    if (currentRole === 'bursar') return '/admin/bursary';
    if (currentRole === 'pta_financial_secretary') return '/admin/pta-payments';
    if (currentRole === 'parent' || currentRole === 'student') return '/student/dashboard';
    return '/admin';
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white border-2 border-red-200 rounded-3xl shadow-xl p-8 text-center relative overflow-hidden">
        {/* Top Warning Glow */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-red-600 via-amber-500 to-red-600"></div>
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Shield Icon */}
        <div className="w-20 h-20 bg-red-50 border-2 border-red-200 rounded-full mx-auto flex items-center justify-center mb-6 shadow-sm">
          <ShieldAlert className="w-10 h-10 text-red-600 animate-pulse" />
        </div>

        {/* Security Title */}
        <span className="text-[11px] font-black text-red-600 uppercase tracking-widest bg-red-50 border border-red-200/80 px-3 py-1 rounded-full">
          RBAC Security Protocol
        </span>

        {/* Standard Security Denial Message */}
        <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-4 mb-2">
          {message}
        </h2>

        {/* Context Information */}
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          {reason || "Your authenticated credentials do not possess the required privileges to view, inspect, or modify records in this partition. All cross-role access attempts are audited."}
        </p>

        {/* Active Role Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-left mb-6 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-semibold">Active Session Role:</span>
            <span className="font-bold uppercase tracking-wider text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
              {currentRole.replace(/_/g, ' ')}
            </span>
          </div>
          {attemptedSection && (
            <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
              <span className="text-slate-500 font-semibold">Restricted Section:</span>
              <span className="font-mono text-red-600 font-bold">{attemptedSection}</span>
            </div>
          )}
          <div className="flex justify-between items-center border-t border-slate-200/60 pt-2">
            <span className="text-slate-500 font-semibold">Security Enforcement:</span>
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Zero-Leak Enforced
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate(getAuthorizedRedirect())}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Authorized Workspace
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/')}
            className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Public Home
          </Button>
        </div>
      </div>
    </div>
  );
}
