import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  Cell, ReferenceLine, CartesianGrid, Legend 
} from 'recharts';
import { Award, TrendingUp, BarChart3, Layers, CheckCircle2, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface SubjectScoreItem {
  name: string;
  ca1?: number;
  ca2?: number;
  ca3?: number;
  ca4?: number;
  ca?: number;
  exam: number;
  total: number;
  grade?: string;
  remark?: string;
  position?: string;
}

interface SubjectScoresChartProps {
  subjects: SubjectScoreItem[];
  compact?: boolean;
  showBreakdownToggle?: boolean;
  studentName?: string;
}

// Grade color scheme: Distinction, Credit, Pass, Below Pass
const getScoreColor = (score: number) => {
  if (score >= 75) return '#059669'; // Emerald 600 (A - Distinction)
  if (score >= 65) return '#2563eb'; // Blue 600 (B - Very Good)
  if (score >= 50) return '#d97706'; // Amber 600 (C - Credit/Pass)
  if (score >= 40) return '#ea580c'; // Orange 600 (D - Fair Pass)
  return '#dc2626'; // Red 600 (F - Needs Improvement)
};

const getGradeBadge = (score: number) => {
  if (score >= 75) return { label: 'A', text: 'Distinction', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (score >= 65) return { label: 'B', text: 'Very Good', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  if (score >= 50) return { label: 'C', text: 'Credit', color: 'bg-amber-50 text-amber-700 border-amber-200' };
  if (score >= 40) return { label: 'D', text: 'Pass', color: 'bg-orange-50 text-orange-700 border-orange-200' };
  return { label: 'F', text: 'Fail', color: 'bg-red-50 text-red-700 border-red-200' };
};

// Custom interactive and print-ready tooltip
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const badge = getGradeBadge(data.total);

    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-2xl border border-slate-700 text-xs min-w-[190px] pointer-events-none z-50">
        <div className="flex items-center justify-between pb-2 border-b border-slate-700/80 mb-2">
          <span className="font-bold text-slate-100 text-sm tracking-tight">{data.fullName || data.name}</span>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${badge.color}`}>
            {data.grade || badge.label}
          </span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between items-center text-slate-300">
            <span>Continuous Assessment (CA):</span>
            <span className="font-bold text-blue-300">{data.ca} / 40</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span>Terminal Examination:</span>
            <span className="font-bold text-amber-300">{data.exam} / 60</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-slate-800 text-white font-black text-xs">
            <span>Final Subject Score:</span>
            <span className="text-emerald-400 font-extrabold">{data.total} / 100</span>
          </div>
          {data.remark && (
            <div className="text-[10px] italic text-slate-400 pt-1 text-center">
              "{data.remark}"
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

export default function SubjectScoresChart({ 
  subjects = [], 
  compact = false, 
  showBreakdownToggle = true,
  studentName
}: SubjectScoresChartProps) {
  const [chartMode, setChartMode] = useState<'total' | 'stacked'>('total');
  const [isSorted, setIsSorted] = useState<boolean>(false);

  if (!subjects || subjects.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 text-center text-slate-400 text-xs rounded-xl">
        No subject score data available to plot chart.
      </div>
    );
  }

  // Prepare normalized chart data
  const rawData = subjects.map((s) => {
    // compute CA if not explicitly provided
    const caVal = s.ca !== undefined 
      ? s.ca 
      : ((s.ca1 || 0) + (s.ca2 || 0) + (s.ca3 || 0) + (s.ca4 || 0));
    
    // short display label
    let displayName = s.name;
    if (displayName.length > (compact ? 9 : 14)) {
      displayName = displayName.substring(0, compact ? 8 : 12) + '...';
    }

    return {
      fullName: s.name,
      name: displayName,
      ca: caVal,
      exam: s.exam || 0,
      total: s.total,
      grade: s.grade || getGradeBadge(s.total).label,
      remark: s.remark,
      fill: getScoreColor(s.total)
    };
  });

  const chartData = isSorted 
    ? [...rawData].sort((a, b) => b.total - a.total) 
    : rawData;

  const highestSubject = [...rawData].sort((a, b) => b.total - a.total)[0];
  const lowestSubject = [...rawData].sort((a, b) => a.total - b.total)[0];
  const avgScore = (rawData.reduce((acc, curr) => acc + curr.total, 0) / rawData.length).toFixed(1);
  const passCount = rawData.filter(s => s.total >= 50).length;
  const passRate = Math.round((passCount / rawData.length) * 100);

  return (
    <div className={`w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs transition-all ${compact ? 'border-slate-300 p-3 mb-4' : 'mb-6'}`}>
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200 shadow-xs">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 font-sans">
                Subject Performance Visual Analytics
              </h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {subjects.length} Subjects
              </span>
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">
              Comparative score distribution out of 100 maximum marks per subject
            </p>
          </div>
        </div>

        {/* View Mode Controls (Interactive Screen Mode Only) */}
        {showBreakdownToggle && !compact && (
          <div className="flex items-center gap-2 print:hidden self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsSorted(!isSorted)}
              className={`h-7 px-2.5 text-[10px] font-bold rounded-lg border ${isSorted ? 'bg-blue-50 text-blue-700 border-blue-300' : 'text-slate-600 border-slate-200'}`}
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              {isSorted ? 'Ranked (Highest First)' : 'Standard Order'}
            </Button>

            <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200 flex items-center">
              <button
                type="button"
                onClick={() => setChartMode('total')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all ${chartMode === 'total' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Total Score
              </button>
              <button
                type="button"
                onClick={() => setChartMode('stacked')}
                className={`px-2.5 py-1 text-[10px] font-bold rounded-md transition-all flex items-center gap-1 ${chartMode === 'stacked' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Layers className="w-3 h-3 text-amber-500" />
                CA vs Exam
              </button>
            </div>
          </div>
        )}
      </div>

      {/* KPI Highlights Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-4">
        <div className="p-2 sm:p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
          <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">Top Subject</span>
          <span className="text-xs font-black text-slate-900 truncate block mt-0.5" title={highestSubject?.fullName}>
            🏆 {highestSubject?.fullName || 'N/A'}
          </span>
          <span className="text-[10px] font-bold text-emerald-600">
            {highestSubject?.total}% ({highestSubject?.grade})
          </span>
        </div>

        <div className="p-2 sm:p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
          <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">Average Score</span>
          <span className="text-base font-black text-blue-700 block mt-0.5 font-serif">
            {avgScore}%
          </span>
          <span className="text-[9px] text-slate-400 font-medium">Academic Average</span>
        </div>

        <div className="p-2 sm:p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
          <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">Pass Benchmark</span>
          <span className="text-base font-black text-emerald-700 block mt-0.5 font-serif">
            {passCount} / {rawData.length}
          </span>
          <span className="text-[9px] text-emerald-600 font-bold">
            {passRate}% Above Pass Mark
          </span>
        </div>

        <div className="p-2 sm:p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
          <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider">Strongest Pillar</span>
          <span className="text-xs font-black text-slate-900 block mt-0.5">
            CA + Exam Synergy
          </span>
          <span className="text-[9px] text-slate-500 font-medium">Balanced Evaluation</span>
        </div>
      </div>

      {/* Main Chart Visualization */}
      <div className={compact ? "h-44 w-full" : "h-56 sm:h-64 w-full"}>
        <ResponsiveContainer width="100%" height="100%">
          {chartMode === 'total' ? (
            <BarChart 
              data={chartData} 
              margin={{ top: 15, right: 10, left: -20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: compact ? 7 : 9, fill: '#475569', fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                interval={0}
                angle={compact || chartData.length > 8 ? -35 : 0}
                textAnchor={compact || chartData.length > 8 ? 'end' : 'middle'}
                dy={compact || chartData.length > 8 ? 8 : 4}
              />
              <YAxis 
                domain={[0, 100]} 
                ticks={[0, 20, 40, 50, 60, 80, 100]}
                tick={{ fontSize: 9, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Pass mark reference threshold (50%) */}
              <ReferenceLine 
                y={50} 
                stroke="#d97706" 
                strokeDasharray="4 4" 
                strokeWidth={1.5}
                label={{ 
                  value: 'Pass Mark (50%)', 
                  position: 'insideTopRight', 
                  fill: '#d97706', 
                  fontSize: 8,
                  fontWeight: 'bold' 
                }} 
              />

              <Bar 
                dataKey="total" 
                radius={[5, 5, 0, 0]} 
                maxBarSize={compact ? 24 : 36}
                animationDuration={600}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            <BarChart 
              data={chartData} 
              margin={{ top: 15, right: 10, left: -20, bottom: 25 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: compact ? 7 : 9, fill: '#475569', fontWeight: 600 }}
                axisLine={{ stroke: '#cbd5e1' }}
                tickLine={false}
                interval={0}
                angle={compact || chartData.length > 8 ? -35 : 0}
                textAnchor={compact || chartData.length > 8 ? 'end' : 'middle'}
                dy={compact || chartData.length > 8 ? 8 : 4}
              />
              <YAxis 
                domain={[0, 100]} 
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fontSize: 9, fill: '#64748b' }} 
                axisLine={false} 
                tickLine={false} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={28}
                iconType="circle"
                wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }}
              />
              <Bar 
                dataKey="ca" 
                name="Continuous Assessment (40)" 
                stackId="scoreStack" 
                fill="#3b82f6" 
                maxBarSize={compact ? 24 : 36} 
              />
              <Bar 
                dataKey="exam" 
                name="Terminal Examination (60)" 
                stackId="scoreStack" 
                fill="#0f172a" 
                radius={[5, 5, 0, 0]} 
                maxBarSize={compact ? 24 : 36} 
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend & Grade Color Key */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 text-[9px] font-bold text-slate-500">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-slate-400 uppercase tracking-widest text-[8px]">Grade Scale:</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#059669]"></span>
            A (75 - 100%) Distinction
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#2563eb]"></span>
            B (65 - 74%) Very Good
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#d97706]"></span>
            C (50 - 64%) Credit
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#dc2626]"></span>
            F (&lt; 50%) Needs Attention
          </span>
        </div>

        <div className="flex items-center gap-1 text-[9px] font-semibold text-slate-400">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Officially Verified Grading Standard
        </div>
      </div>
    </div>
  );
}
