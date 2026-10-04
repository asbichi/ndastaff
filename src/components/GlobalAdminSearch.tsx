import React, { useState, useEffect, useRef } from 'react';
import { Search, GraduationCap, Users, FileText, ChevronRight, Loader2, X } from 'lucide-react';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

export default function GlobalAdminSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<{
    students: any[];
    staff: any[];
    scores: any[];
  }>({ students: [], staff: [], scores: [] });

  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch search matches across collections
  useEffect(() => {
    if (!searchTerm || searchTerm.trim().length < 2) {
      setResults({ students: [], staff: [], scores: [] });
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setIsOpen(true);
      const termLower = searchTerm.trim().toLowerCase();

      try {
        const [studentsSnap, staffSnap, scoresSnap] = await Promise.all([
          getDocs(query(collection(db, 'students'), limit(50))),
          getDocs(query(collection(db, 'staff'), limit(50))),
          getDocs(query(collection(db, 'scores'), limit(50)))
        ]);

        const matchedStudents: any[] = [];
        studentsSnap.forEach(d => {
          const data = d.data();
          if (
            (data.name || '').toLowerCase().includes(termLower) ||
            (data.admissionNo || '').toLowerCase().includes(termLower) ||
            (data.class || '').toLowerCase().includes(termLower)
          ) {
            matchedStudents.push({ id: d.id, ...data });
          }
        });

        const matchedStaff: any[] = [];
        staffSnap.forEach(d => {
          const data = d.data();
          if (
            (data.name || '').toLowerCase().includes(termLower) ||
            (data.staffId || '').toLowerCase().includes(termLower) ||
            (data.department || '').toLowerCase().includes(termLower)
          ) {
            matchedStaff.push({ id: d.id, ...data });
          }
        });

        const matchedScores: any[] = [];
        scoresSnap.forEach(d => {
          const data = d.data();
          if (
            (data.studentName || '').toLowerCase().includes(termLower) ||
            (data.admissionNo || '').toLowerCase().includes(termLower) ||
            (data.subject || '').toLowerCase().includes(termLower)
          ) {
            matchedScores.push({ id: d.id, ...data });
          }
        });

        setResults({
          students: matchedStudents.slice(0, 5),
          staff: matchedStaff.slice(0, 5),
          scores: matchedScores.slice(0, 5)
        });
      } catch (err) {
        console.error("Global search error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSelectStudent = (student: any) => {
    setIsOpen(false);
    setSearchTerm('');
    navigate('/admin/students');
  };

  const handleSelectStaff = (staffMember: any) => {
    setIsOpen(false);
    setSearchTerm('');
    navigate('/admin/staff');
  };

  const handleSelectScore = (scoreRecord: any) => {
    setIsOpen(false);
    setSearchTerm('');
    navigate('/admin/scores');
  };

  const totalResultsCount = results.students.length + results.staff.length + results.scores.length;

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input 
          type="text" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search students, staff, exam records by name or ID..." 
          className="w-full bg-slate-50 border border-slate-200 text-xs pl-9 pr-8 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 placeholder:text-slate-400"
        />
        {searchTerm && (
          <button 
            onClick={() => { setSearchTerm(''); setIsOpen(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden max-h-[420px] overflow-y-auto"
          >
            {isLoading ? (
              <div className="p-6 text-center space-y-2">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-blue-600" />
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Searching records...</p>
              </div>
            ) : totalResultsCount === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No matching records found for <strong className="text-slate-800">"{searchTerm}"</strong>.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {/* Students Section */}
                {results.students.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                      Students ({results.students.length})
                    </div>
                    {results.students.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => handleSelectStudent(student)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-blue-50 text-blue-600 rounded-full flex items-center font-bold justify-center text-[10px] shrink-0">
                            {student.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 group-hover:text-blue-600">{student.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">Reg: {student.admissionNo} • {student.class}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Staff Section */}
                {results.staff.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      Staff Members ({results.staff.length})
                    </div>
                    {results.staff.map((staff) => (
                      <div
                        key={staff.id}
                        onClick={() => handleSelectStaff(staff)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-emerald-50 text-emerald-600 rounded-full flex items-center font-bold justify-center text-[10px] shrink-0">
                            {staff.name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 group-hover:text-emerald-600">{staff.name}</div>
                            <div className="text-[10px] text-slate-400">ID: {staff.staffId || 'Staff'} • {staff.department || staff.role}</div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Exam Records Section */}
                {results.scores.length > 0 && (
                  <div className="p-2">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-purple-600" />
                      Exam & Score Records ({results.scores.length})
                    </div>
                    {results.scores.map((score) => (
                      <div
                        key={score.id}
                        onClick={() => handleSelectScore(score)}
                        className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 bg-purple-50 text-purple-600 rounded-full flex items-center font-bold justify-center text-[10px] shrink-0">
                            {score.subject?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 group-hover:text-purple-600">
                              {score.subject} — {score.studentName}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Score: <strong className="text-slate-700">{score.total}</strong> ({score.grade}) • {score.term}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-purple-600" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
