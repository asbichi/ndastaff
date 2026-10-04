import { LOGO_BASE64 } from "@/src/logoBase64";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, Award, ShieldCheck, Mail, Phone, ChevronDown, 
  ChevronUp, Home, BookOpen, LayoutGrid, Calendar, CheckCircle2, 
  ArrowRight, ExternalLink, HeartHandshake, Eye, Sparkles, Star,
  GraduationCap, Building2, UserCheck, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export interface PtaExecutive {
  id: string;
  name: string;
  title: string;
  role: string;
  imageUrl: string;
  description: string;
  order: number;
  category?: 'patron' | 'management' | 'elected';
}

export default function ExcoPta() {
  const [excos, setExcos] = useState<PtaExecutive[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExco, setSelectedExco] = useState<PtaExecutive | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'presidium' | 'management' | 'elected'>('all');
  const [isLoginDropdownOpen, setIsLoginDropdownOpen] = useState(false);
  const loginDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchPtaExcos() {
      try {
        setLoading(true);
        const colRef = collection(db, 'gallery_members');
        const q = query(colRef, orderBy('order', 'asc'));
        const snapshot = await getDocs(q);

        const list = snapshot.docs.map(doc => {
          const data = doc.data();
          const title = (data.title || '').toLowerCase();
          const name = (data.name || '').toLowerCase();

          // Categorize members
          let category: 'patron' | 'management' | 'elected' = 'elected';
          if (title.includes('commandant') || title.includes('patron') || (title.includes('chair') && !title.includes('vice'))) {
            category = 'patron';
          } else if (
            title.includes('principal') || 
            title.includes('vice') || 
            title.includes('registrar') ||
            name.includes('principal') ||
            name.includes('registrar')
          ) {
            category = 'management';
          }

          return {
            id: doc.id,
            ...data,
            category
          } as PtaExecutive;
        });

        // Sort strictly according to official rank / position hierarchy:
        // 1. Commandant (Grand Patron)
        // 2. PTA Chairman
        // 3. Vice Chairman PTA
        // 4. Principal
        // 5. Vice Principal (Admin)
        // 6. Vice Principal (Academics)
        // 7. School Registrar
        // 8. General Secretary
        // 9. Asst. Secretary General
        // 10. Auditor General
        // 11. Welfare Officer
        const getPriority = (item: PtaExecutive) => {
          const t = (item.title || '').toLowerCase();
          const n = (item.name || '').toLowerCase();
          if (t.includes('commandant')) return 1;
          if (t.includes('chair') && !t.includes('vice')) return 2;
          if (t.includes('vice') && t.includes('chair')) return 3;
          if (t.includes('principal') && !t.includes('vice')) return 4;
          if (t.includes('vice') && t.includes('admin')) return 5;
          if ((t.includes('vice') && t.includes('acad')) || n.includes('freely')) return 6;
          if (t.includes('registrar') || n.includes('registrar')) return 7;
          if (t.includes('general secretary') || (t.includes('secretary') && !t.includes('asst'))) return 8;
          if (t.includes('asst') && t.includes('sec')) return 9;
          if (t.includes('auditor')) return 10;
          if (t.includes('welfare')) return 11;
          return item.order || 20;
        };

        list.sort((a, b) => {
          const priorityA = a.order || getPriority(a);
          const priorityB = b.order || getPriority(b);
          return priorityA - priorityB;
        });

        setExcos(list);
      } catch (err) {
        console.error("Error fetching PTA EXCOs:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPtaExcos();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (loginDropdownRef.current && !loginDropdownRef.current.contains(event.target as Node)) {
        setIsLoginDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filtered lists
  const commandant = excos.find(e => e.title.toLowerCase().includes('commandant'));
  const chairman = excos.find(e => e.title.toLowerCase().includes('chair') && !e.title.toLowerCase().includes('vice'));

  const filteredExcos = excos.filter(e => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'presidium') {
      return e.id === commandant?.id || e.id === chairman?.id || e.title.toLowerCase().includes('vice chairman');
    }
    if (activeFilter === 'management') {
      const t = e.title.toLowerCase();
      return (
        t.includes('principal') || 
        t.includes('vice') || 
        t.includes('registrar')
      ) && !t.includes('vice chairman');
    }
    if (activeFilter === 'elected') {
      const t = e.title.toLowerCase();
      return !t.includes('commandant') && !t.includes('principal') && !t.includes('registrar') && !(t.includes('vice') && !t.includes('vice chairman'));
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation */}
      <nav className="flex items-center justify-between p-6 bg-primary text-white sticky top-0 z-50 shadow-lg">
        <Link to="/" className="flex items-center gap-3 bg-black px-3 py-1.5 border border-white/10">
          <img src={LOGO_BASE64} alt="NDA Logo" className="w-8 h-8 object-contain bg-white rounded-full p-0.5 shrink-0" />
          <span className="font-serif font-bold text-sm tracking-wider uppercase text-white">NDA STAFF SECONDARY SCHOOL</span>
        </Link>

        <div className="flex items-center gap-4 text-sm font-medium">
          <Link to="/" className="hover:text-blue-300 transition-colors hidden md:block">HOME</Link>
          <Link to="/about" className="hover:text-blue-300 transition-colors hidden md:block">ABOUT</Link>
          <Link to="/courses" className="hover:text-blue-300 transition-colors hidden md:block">ACADEMICS</Link>
          <Link to="/exco-pta" className="text-amber-300 border-b-2 border-amber-300 pb-1 hover:text-amber-400 transition-colors hidden md:block font-bold">
            EXCO PTA
          </Link>
          <Link to="/gallery" className="hover:text-blue-300 transition-colors hidden md:block">GALLERY</Link>
          <Link to="/contact" className="hover:text-blue-300 transition-colors hidden md:block">CONTACT</Link>
          
          {/* Desktop Login Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/login?role=student">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs uppercase tracking-wider px-3 h-9">
                Student Portal
              </Button>
            </Link>
            <Link to="/login?role=admin">
              <Button className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider px-3 h-9 flex items-center gap-1.5 shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5" />
                Staff Login
              </Button>
            </Link>
          </div>

          {/* Mobile Login Dropdown */}
          <div className="relative md:hidden" ref={loginDropdownRef}>
            <Button
              onClick={() => setIsLoginDropdownOpen(!isLoginDropdownOpen)}
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-primary text-xs uppercase tracking-wider px-3 h-9 flex items-center gap-1"
            >
              <span>Menu</span>
              {isLoginDropdownOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>

            <AnimatePresence>
              {isLoginDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 mt-2 w-48 bg-white border border-slate-100 shadow-2xl z-50 rounded-md overflow-hidden text-slate-800"
                >
                  <div className="p-1 flex flex-col gap-1">
                    <Link 
                      to="/"
                      onClick={() => setIsLoginDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      <Home className="w-4 h-4 text-slate-400" />
                      Home
                    </Link>
                    <Link 
                      to="/about"
                      onClick={() => setIsLoginDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 border-t border-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      <Users className="w-4 h-4 text-slate-400" />
                      About
                    </Link>
                    <Link 
                      to="/courses"
                      onClick={() => setIsLoginDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 border-t border-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      Academics
                    </Link>
                    <Link 
                      to="/exco-pta"
                      onClick={() => setIsLoginDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 border-t border-slate-50 text-xs font-bold uppercase tracking-wider text-amber-700 hover:bg-amber-50 transition-all font-semibold"
                    >
                      <Award className="w-4 h-4 text-amber-600" />
                      EXCO PTA
                    </Link>
                    <Link 
                      to="/gallery"
                      onClick={() => setIsLoginDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 border-t border-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-all font-semibold text-blue-600"
                    >
                      <LayoutGrid className="w-4 h-4 text-blue-500" />
                      Gallery
                    </Link>
                    <Link 
                      to="/contact"
                      onClick={() => setIsLoginDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 border-t border-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-slate-50 transition-all"
                    >
                      <Mail className="w-4 h-4 text-slate-400" />
                      Contact
                    </Link>
                    
                    <div className="border-t border-slate-100 my-1"></div>

                    <Link 
                      to="/login?role=student"
                      onClick={() => setIsLoginDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 hover:bg-blue-50 transition-all"
                    >
                      <Users className="w-4 h-4 text-blue-600" />
                      Student Portal
                    </Link>
                    <Link 
                      to="/login?role=admin"
                      onClick={() => setIsLoginDropdownOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold uppercase tracking-wider text-amber-700 hover:bg-amber-50 transition-all font-bold border-t border-slate-50"
                    >
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      Staff / Admin Login
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white py-16 px-6 text-center border-b border-white/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="max-w-4xl mx-auto relative z-10">
          <Badge className="bg-amber-500/20 text-amber-300 border border-amber-400/40 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest mb-4">
            Joint Executive Leadership Council · 2024–2026 Tenure
          </Badge>
          <motion.h1 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight"
          >
            PARENT TEACHER ASSOCIATION <br />
            <span className="text-amber-400">EXECUTIVE COMMITTEE (EXCO PTA)</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-slate-300 mt-4 text-base md:text-lg max-w-3xl mx-auto font-light leading-relaxed"
          >
            The statutory joint executive council comprising the Military Command Directorship, School Management Authorities, and Parent Executive Leadership of NDA Staff Secondary School, Kaduna.
          </motion.p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-12 flex-1 w-full space-y-16">

        {/* 1. Presidium Dual Showcase: The Commandant & The PTA Chairman */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div>
              <span className="text-amber-600 font-bold text-xs uppercase tracking-widest block">Executive Presidium</span>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Council Patron & Chairmanship</h2>
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-xs font-bold">
              Apex Council
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* The Commandant Card */}
            {commandant && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-white/10 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-60 h-60 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start relative z-10">
                  <div className="relative shrink-0">
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-amber-400 bg-slate-800 overflow-hidden shadow-xl flex items-center justify-center">
                      {commandant.imageUrl ? (
                        <img src={commandant.imageUrl} alt={commandant.name} className="w-full h-full object-cover object-top" />
                      ) : (
                        <Shield className="w-12 h-12 text-slate-400" />
                      )}
                    </div>
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-black text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow whitespace-nowrap">
                      Grand Patron
                    </span>
                  </div>

                  <div className="space-y-2 text-center sm:text-left">
                    <span className="text-amber-400 text-[11px] font-bold uppercase tracking-widest">Command Patron</span>
                    <h3 className="text-xl md:text-2xl font-bold tracking-tight">{commandant.name}</h3>
                    <p className="text-xs font-semibold text-blue-300">{commandant.title} · Nigerian Defence Academy</p>
                    <p className="text-slate-300 text-xs leading-relaxed line-clamp-4 pt-1">
                      {commandant.description || "Providing supreme strategic leadership, high standards of military and academic discipline, and institutional support for the Parent Teacher Association."}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/10 mt-6 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">Statutory Grand Patron & Sponsor</span>
                  <Button 
                    size="sm"
                    onClick={() => setSelectedExco(commandant)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    View Patron Profile
                  </Button>
                </div>
              </motion.div>
            )}

            {/* The PTA Chairman Card */}
            {chairman && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-gradient-to-br from-amber-500/10 via-white to-blue-50/50 rounded-3xl p-6 md:p-8 shadow-xl border-2 border-amber-400/50 flex flex-col justify-between relative overflow-hidden"
              >
                <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start relative z-10">
                  <div className="relative shrink-0">
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-amber-500 bg-slate-100 overflow-hidden shadow-xl flex items-center justify-center">
                      {chairman.imageUrl ? (
                        <img src={chairman.imageUrl} alt={chairman.name} className="w-full h-full object-cover object-top" />
                      ) : (
                        <Users className="w-12 h-12 text-slate-400" />
                      )}
                    </div>
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-amber-600 text-white font-black text-[9px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow whitespace-nowrap">
                      Council Chairman
                    </span>
                  </div>

                  <div className="space-y-2 text-center sm:text-left">
                    <span className="text-amber-700 text-[11px] font-bold uppercase tracking-widest">Executive Chairman</span>
                    <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{chairman.name}</h3>
                    <p className="text-xs font-semibold text-blue-700">{chairman.title} · NDA Staff Secondary School PTA</p>
                    <p className="text-slate-600 text-xs leading-relaxed line-clamp-4 pt-1">
                      {chairman.description || "Leading the executive council in promoting mutual understanding, robust educational standards, and infrastructural advancement across NDA Staff Secondary School."}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-amber-200/60 mt-6 flex justify-between items-center">
                  <span className="text-[11px] text-slate-500">Executive Head of Council</span>
                  <Button 
                    size="sm"
                    onClick={() => setSelectedExco(chairman)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1.5" />
                    View Chairman Profile
                  </Button>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* 2. Filter Switchers */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: `All EXCO Members (${excos.length})` },
              { id: 'management', label: 'School Leadership (Principal, VPs, Registrar)' },
              { id: 'elected', label: 'Elected Parent Officers' },
              { id: 'presidium', label: 'Patron & Presidium' }
            ].map(tab => (
              <Button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as any)}
                variant={activeFilter === tab.id ? 'default' : 'outline'}
                className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-wider font-bold transition-all ${
                  activeFilter === tab.id
                    ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <span className="text-xs text-slate-500 font-semibold">
            Showing {filteredExcos.length} Council Executives
          </span>
        </div>

        {/* 3. Comprehensive EXCO Roster Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-600 mx-auto mb-3"></div>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">Loading Council Members...</p>
            </div>
          ) : (
            filteredExcos.map((member, idx) => {
              const isSchoolMgmt = member.category === 'management' || 
                member.title.toLowerCase().includes('principal') || 
                member.title.toLowerCase().includes('registrar');
              const isPatronOrChair = member.category === 'patron' || 
                member.title.toLowerCase().includes('commandant') || 
                (member.title.toLowerCase().includes('chair') && !member.title.toLowerCase().includes('vice'));

              return (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                >
                  <Card className="overflow-hidden border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-200 rounded-2xl bg-white flex flex-col h-full group hover:-translate-y-1">
                    {/* Portrait Area */}
                    <div className="pt-6 pb-2 bg-gradient-to-b from-slate-50 to-white flex flex-col items-center justify-center relative">
                      <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-amber-400/80 bg-slate-100 overflow-hidden shadow-md flex items-center justify-center relative">
                        {member.imageUrl ? (
                          <img 
                            src={member.imageUrl} 
                            alt={member.name} 
                            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 p-2 text-center">
                            {isSchoolMgmt ? (
                              <Building2 className="w-8 h-8 mb-1 text-blue-400" />
                            ) : (
                              <Users className="w-8 h-8 mb-1 text-amber-400" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Position / Rank Number Badge on Top-Left */}
                      <div className="absolute top-3 left-3 z-10">
                        <span className="bg-black/80 backdrop-blur-xs text-amber-300 font-extrabold text-[10px] px-2.5 py-0.5 rounded-full border border-amber-400/40 shadow-sm flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400" />
                          #{member.order}
                        </span>
                      </div>

                      {/* Top Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className={`text-[10px] font-bold border-none ${
                          isPatronOrChair 
                            ? 'bg-amber-600 text-white' 
                            : isSchoolMgmt 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-900/80 text-white'
                        }`}>
                          {isPatronOrChair ? 'Presidium' : isSchoolMgmt ? 'Ex-Officio' : 'Elected Officer'}
                        </Badge>
                      </div>
                    </div>

                    {/* Information Area */}
                    <CardContent className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider block ${
                          isSchoolMgmt ? 'text-blue-700' : 'text-amber-700'
                        }`}>
                          {member.title}
                        </span>
                        <h3 className="font-bold text-sm text-slate-900 mt-1 line-clamp-1">
                          {member.name}
                        </h3>
                        <p className="text-slate-500 text-xs mt-1.5 line-clamp-3 leading-relaxed">
                          {member.description || "Executive council member serving NDA Staff Secondary School PTA community."}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedExco(member)}
                          className="w-full text-xs font-semibold text-slate-700 hover:text-amber-700 hover:bg-amber-50 flex items-center justify-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Portfolio
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>

        {/* 4. Strategic Objectives of the Joint PTA Council */}
        <div className="bg-slate-950 text-white rounded-3xl p-8 md:p-12 relative overflow-hidden border border-white/10">
          <div className="max-w-3xl space-y-3">
            <span className="text-amber-400 text-xs font-black uppercase tracking-widest">Coordinated Governance</span>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              School Management & PTA Unified Leadership
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              By statutory charter, the Commandant of the Nigerian Defence Academy serves as Grand Patron, the Principal acts as Chief Executive Host, and the Vice Principals (Admin & Academics) alongside the Registrar join the elected parent executives to guide policy, infrastructure, discipline, and student success.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
              <CheckCircle2 className="w-6 h-6 text-amber-400" />
              <h4 className="font-bold text-sm">Academic Standards</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Continuous syllabus oversight, teacher support, and modern CBT infrastructure.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
              <HeartHandshake className="w-6 h-6 text-blue-400" />
              <h4 className="font-bold text-sm">Student Welfare</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Health facilities, recreational provisions, and security inside Ribadu Campus.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h4 className="font-bold text-sm">Campus Development</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Joint commissioning of laboratory apparatus, classrooms, and technology tools.</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
              <Building2 className="w-6 h-6 text-purple-400" />
              <h4 className="font-bold text-sm">Fiscal Accountability</h4>
              <p className="text-xs text-slate-400 leading-relaxed">Full auditing, transparent PTA levy reporting, and prompt community stewardship.</p>
            </div>
          </div>
        </div>

      </div>

      {/* Member Details Modal */}
      <Dialog open={!!selectedExco} onOpenChange={(open) => !open && setSelectedExco(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-600" />
              Council Member Profile
            </DialogTitle>
          </DialogHeader>

          {selectedExco && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-4 bg-amber-50/50 p-4 rounded-xl border border-amber-200/60">
                <div className="w-20 h-24 rounded-lg border-2 border-amber-500 bg-white overflow-hidden shadow-sm flex items-center justify-center shrink-0">
                  {selectedExco.imageUrl ? (
                    <img src={selectedExco.imageUrl} alt={selectedExco.name} className="w-full h-full object-cover object-top" />
                  ) : (
                    <Users className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedExco.name}</h3>
                  <Badge className="bg-amber-600 text-white text-[10px] font-bold mt-1">
                    {selectedExco.title}
                  </Badge>
                  <p className="text-xs text-slate-500 mt-1">PTA Executive Committee · NDA Staff School</p>
                </div>
              </div>

              <div className="text-xs space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <span className="font-bold text-[10px] uppercase text-slate-400 tracking-wider block">Official Duties & Bio</span>
                <p className="text-slate-700 leading-relaxed">{selectedExco.description || "Serving the school and parent community with dedication and excellence."}</p>
              </div>

              <Button onClick={() => setSelectedExco(null)} className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-primary text-white py-12 px-6 border-t border-white/10 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <img src={LOGO_BASE64} alt="NDA Logo" className="w-8 h-8 object-contain bg-white rounded-full p-0.5" />
            <span className="font-serif font-bold text-sm tracking-wider uppercase">NDA STAFF SECONDARY SCHOOL</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-blue-200">
            <Link to="/" className="hover:text-white">Home</Link>
            <Link to="/about" className="hover:text-white">About</Link>
            <Link to="/courses" className="hover:text-white">Academics</Link>
            <Link to="/exco-pta" className="text-amber-300 font-bold hover:text-white">EXCO PTA</Link>
            <Link to="/gallery" className="hover:text-white">Gallery</Link>
            <Link to="/contact" className="hover:text-white">Contact</Link>
          </div>
          <p className="text-xs text-blue-300">
            &copy; {new Date().getFullYear()} NDA Staff Secondary School PTA Council. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
