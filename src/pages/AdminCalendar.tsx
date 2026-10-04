import React, { useState, useEffect } from 'react';
import { 
  collection, query, orderBy, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, onSnapshot 
} from 'firebase/firestore';
import { db } from '../firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight, Clock, 
  MapPin, Tag, Trash2, Edit, Loader2, Sparkles, AlertCircle, CheckCircle2 
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export interface SchoolEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time?: string;
  category: 'Exam' | 'Deadline' | 'Event' | 'Meeting';
  location?: string;
  description?: string;
}

export default function AdminCalendar() {
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  
  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SchoolEvent | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [category, setCategory] = useState<'Exam' | 'Deadline' | 'Event' | 'Meeting'>('Event');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Drag and drop state
  const [draggedEventId, setDraggedEventId] = useState<string | null>(null);

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, 'school_calendar_events'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items: SchoolEvent[] = [];
      if (snapshot.empty) {
        // Seed initial default calendar events if empty
        seedInitialEvents();
      } else {
        snapshot.forEach(docSnap => {
          items.push({ id: docSnap.id, ...docSnap.data() } as SchoolEvent);
        });
        setEvents(items);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching calendar events:", error);
      toast.error("Failed to load school calendar.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const seedInitialEvents = async () => {
    const defaultEvents = [
      {
        title: 'First Term Continuous Assessment (CA) Exams',
        date: '2026-10-15',
        time: '08:00 AM',
        category: 'Exam',
        location: 'NDA CBT Hall & Classrooms',
        description: 'Mid-term examinations for all JSS and SSS students across subjects.'
      },
      {
        title: 'PTA General Executive Council Meeting',
        date: '2026-10-20',
        time: '03:00 PM',
        category: 'Meeting',
        location: 'Staff Assembly Hall',
        description: 'Discussion on infrastructural development and 2026 academic calendar milestones.'
      },
      {
        title: 'Term Project & Assignment Submission Deadline',
        date: '2026-10-28',
        time: '05:00 PM',
        category: 'Deadline',
        location: 'Online Portal / Department HODs',
        description: 'Deadline for all practical reports, term papers, and portfolio submissions.'
      },
      {
        title: 'NDA Staff School Annual Inter-House Sports',
        date: '2026-11-05',
        time: '09:00 AM',
        category: 'Event',
        location: 'NDA Sports Complex',
        description: 'Annual athletics, football finals, and march past competitions.'
      }
    ];

    try {
      for (const ev of defaultEvents) {
        await addDoc(collection(db, 'school_calendar_events'), {
          ...ev,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Error seeding initial events:", err);
    }
  };

  const handleOpenAdd = (targetDate?: string) => {
    setTitle('');
    setDate(targetDate || new Date().toISOString().split('T')[0]);
    setTime('09:00 AM');
    setCategory('Event');
    setLocation('');
    setDescription('');
    setIsAddOpen(true);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !date) {
      toast.error("Please provide an event title and date.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'school_calendar_events'), {
        title,
        date,
        time,
        category,
        location,
        description,
        createdAt: serverTimestamp()
      });
      toast.success("School event created successfully!");
      setIsAddOpen(false);
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create school event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEdit = (event: SchoolEvent) => {
    setSelectedEvent(event);
    setTitle(event.title);
    setDate(event.date);
    setTime(event.time || '');
    setCategory(event.category);
    setLocation(event.location || '');
    setDescription(event.description || '');
    setIsEditOpen(true);
  };

  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'school_calendar_events', selectedEvent.id), {
        title,
        date,
        time,
        category,
        location,
        description
      });
      toast.success("Event updated successfully!");
      setIsEditOpen(false);
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this scheduled event?")) return;
    try {
      await deleteDoc(doc(db, 'school_calendar_events', eventId));
      toast.success("Event deleted successfully.");
      setIsEditOpen(false);
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event.");
    }
  };

  // Drag and drop reschedule
  const handleDragStart = (e: React.DragEvent, eventId: string) => {
    e.dataTransfer.setData('text/plain', eventId);
    setDraggedEventId(eventId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetDateStr: string) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain') || draggedEventId;
    if (!eventId) return;

    try {
      await updateDoc(doc(db, 'school_calendar_events', eventId), {
        date: targetDateStr
      });
      toast.success(`Event successfully rescheduled to ${targetDateStr}!`);
    } catch (error) {
      console.error("Error rescheduling event:", error);
      toast.error("Failed to reschedule event.");
    } finally {
      setDraggedEventId(null);
    }
  };

  // Calendar month math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysArray = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    daysArray.push(`${year}-${monthStr}-${dayStr}`);
  }

  return (
    <div className="p-6 md:p-12 space-y-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-primary tracking-tight flex items-center gap-3">
            <CalendarIcon className="w-8 h-8 text-blue-600" />
            Interactive School Calendar & Scheduler
          </h1>
          <p className="text-slate-500 mt-1 font-light">
            Visualize upcoming exams, deadlines, meetings, and school events. Drag and drop events to reschedule instantly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => handleOpenAdd()}
            className="rounded-none bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-wider h-10 shadow-md"
          >
            <Plus className="w-4 h-4 mr-2" />
            Schedule New Event
          </Button>
        </div>
      </div>

      {/* Calendar Controls & Navigation */}
      <div className="bg-white border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-serif font-bold text-primary">
            {monthNames[month]} {year}
          </h2>
          <div className="flex items-center gap-1 border border-slate-200">
            <Button variant="ghost" size="sm" onClick={handlePrevMonth} className="rounded-none h-8 w-8 p-0">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="rounded-none h-8 px-2 text-xs font-semibold">
              Today
            </Button>
            <Button variant="ghost" size="sm" onClick={handleNextMonth} className="rounded-none h-8 w-8 p-0">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-rose-500 rounded-full"></span> Exam</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-amber-500 rounded-full"></span> Deadline</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-blue-600 rounded-full"></span> Event</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-emerald-600 rounded-full"></span> Meeting</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-slate-100 border-b border-slate-200 text-center text-[11px] font-bold uppercase tracking-wider text-slate-600 py-3">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-px">
          {isLoading ? (
            <div className="col-span-7 h-96 bg-white flex flex-col items-center justify-center space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Loading calendar schedule...</p>
            </div>
          ) : (
            daysArray.map((dateStr, idx) => {
              if (!dateStr) {
                return <div key={`empty-${idx}`} className="bg-slate-50/60 min-h-[120px]" />;
              }

              const dayEvents = events.filter(e => e.date === dateStr);
              const isToday = dateStr === new Date().toISOString().split('T')[0];

              return (
                <div 
                  key={dateStr}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, dateStr)}
                  className={`bg-white min-h-[130px] p-2 flex flex-col justify-between transition-colors hover:bg-slate-50/40 ${isToday ? 'ring-2 ring-blue-600 inset-0 z-10 bg-blue-50/10' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold font-mono ${isToday ? 'bg-blue-600 text-white px-1.5 py-0.5 rounded-full' : 'text-slate-700'}`}>
                      {parseInt(dateStr.split('-')[2])}
                    </span>
                    <button 
                      onClick={() => handleOpenAdd(dateStr)}
                      className="text-slate-300 hover:text-blue-600 transition-colors p-1"
                      title="Add Event on this day"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 my-1 flex-1 overflow-y-auto max-h-[90px]">
                    {dayEvents.map(ev => {
                      const badgeColor = 
                        ev.category === 'Exam' ? 'bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-200' :
                        ev.category === 'Deadline' ? 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200' :
                        ev.category === 'Meeting' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200' :
                        'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';

                      return (
                        <div
                          key={ev.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, ev.id)}
                          onClick={() => handleOpenEdit(ev)}
                          className={`text-[10px] font-semibold px-2 py-1 rounded border cursor-grab active:cursor-grabbing truncate transition-all shadow-2xs ${badgeColor}`}
                          title={`${ev.title} (${ev.category}) - Drag to reschedule`}
                        >
                          <div className="font-bold truncate">{ev.title}</div>
                          {ev.time && <div className="text-[9px] opacity-75 font-mono">{ev.time}</div>}
                        </div>
                      );
                    })}
                  </div>

                  <div className="text-[9px] text-slate-300 text-right font-mono">
                    {dayEvents.length > 0 ? `${dayEvents.length} event(s)` : ''}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Add Event Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-serif font-bold text-primary flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              Schedule New School Event / Exam
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Add exams, deadlines, meetings, or school events to the interactive calendar.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateEvent} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700">Event / Exam Title *</Label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. SSS 3 Mock Mathematics Examination"
                required
                className="rounded-none text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-700">Date *</Label>
                <Input 
                  type="date"
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  required
                  className="rounded-none text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-700">Time</Label>
                <Input 
                  value={time} 
                  onChange={(e) => setTime(e.target.value)} 
                  placeholder="e.g. 09:00 AM"
                  className="rounded-none text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-700">Category *</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full h-9 rounded-none border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="Exam">Exam</option>
                  <option value="Deadline">Deadline</option>
                  <option value="Event">Event</option>
                  <option value="Meeting">Meeting</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-700">Location / Venue</Label>
                <Input 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="e.g. CBT Hall"
                  className="rounded-none text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700">Description / Notes</Label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Add additional details or instructions..."
                rows={3}
                className="w-full rounded-none border border-slate-200 p-2 text-xs text-slate-700 outline-none"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddOpen(false)}
                className="rounded-none text-xs"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="rounded-none bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-wider"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-2" />}
                Save Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit / Delete Event Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg rounded-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-serif font-bold text-primary flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                Edit / Reschedule Event
              </span>
              {selectedEvent && (
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={() => handleDeleteEvent(selectedEvent.id)}
                  className="rounded-none h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Delete
                </Button>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Modify event details or drag and drop on the calendar grid to reschedule.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateEvent} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700">Event / Exam Title *</Label>
              <Input 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required
                className="rounded-none text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-700">Date *</Label>
                <Input 
                  type="date"
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  required
                  className="rounded-none text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-700">Time</Label>
                <Input 
                  value={time} 
                  onChange={(e) => setTime(e.target.value)} 
                  className="rounded-none text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-700">Category *</Label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full h-9 rounded-none border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none"
                >
                  <option value="Exam">Exam</option>
                  <option value="Deadline">Deadline</option>
                  <option value="Event">Event</option>
                  <option value="Meeting">Meeting</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-slate-700">Location / Venue</Label>
                <Input 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  className="rounded-none text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-slate-700">Description / Notes</Label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                rows={3}
                className="w-full rounded-none border border-slate-200 p-2 text-xs text-slate-700 outline-none"
              />
            </div>

            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditOpen(false)}
                className="rounded-none text-xs"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="rounded-none bg-primary hover:bg-primary/90 text-white text-xs font-bold uppercase tracking-wider"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5 mr-2" />}
                Update Event
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
