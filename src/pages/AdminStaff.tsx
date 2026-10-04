import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, UserCheck, Plus, Edit, Trash2, Search, Loader2, 
  Mail, Phone, Award, BookOpen, GraduationCap, Briefcase, 
  Download, Printer, Filter, X, Check, Eye, ShieldCheck, RefreshCw, UserPlus, Save,
  Upload, FileSpreadsheet, AlertCircle, CheckCircle2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, 
  doc, serverTimestamp, query, orderBy, getDocs, writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface StaffMember {
  id: string;
  name: string;
  staffId: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female' | string;
  role: string;
  department: string;
  subjects: string[];
  classes: string[];
  qualification: string;
  status: 'Active' | 'On Leave' | 'Inactive' | string;
  employmentDate?: string;
  passportPhoto?: string;
  createdAt?: any;
}

const DEPARTMENTS = [
  'Sciences',
  'Arts & Humanities',
  'Commercial Studies',
  'Junior Secondary',
  'School Administration',
  'Bursary & Accounts'
];

const ROLES = [
  'Principal',
  'Vice Principal (Academics)',
  'Vice Principal (Admin)',
  'Head of Department (HOD)',
  'Senior Teacher',
  'Subject Teacher',
  'Form Master / Teacher',
  'Bursar / Accountant',
  'Administrative Officer',
  'Laboratory Technologist',
  'ICT & CBT Coordinator'
];

const ALL_SUBJECTS = [
  'Mathematics', 'English Language', 'Physics', 'Chemistry', 'Biology',
  'Further Mathematics', 'Agricultural Science', 'Economics', 'Civic Education',
  'Government', 'Literature in English', 'History', 'CRS', 'IRS', 'French',
  'Commerce', 'Financial Accounting', 'Computer Science / ICT', 'Basic Science',
  'Basic Technology', 'Social Studies', 'Business Studies', 'Physical & Health Education'
];

const ALL_CLASSES = [
  'JSS 1A', 'JSS 1B', 'JSS 1C', 'JSS 1D',
  'JSS 2A', 'JSS 2B', 'JSS 2C', 'JSS 2D',
  'JSS 3A', 'JSS 3B', 'JSS 3C', 'JSS 3D',
  'SSS 1 Science', 'SSS 1 Art', 'SSS 1 Commerce',
  'SSS 2 Science', 'SSS 2 Art', 'SSS 2 Commerce',
  'SSS 3 Science', 'SSS 3 Art', 'SSS 3 Commerce'
];

const INITIAL_STAFF_SEEDS = [
  {
    name: "Mal Idris A. Umaru",
    staffId: "NDA/STF/001",
    email: "principal@ndastaffschool.edu.ng",
    phone: "08031234567",
    gender: "Male",
    role: "Principal",
    department: "School Administration",
    subjects: ["Civic Education"],
    classes: ["SSS 3 Science", "SSS 3 Art"],
    qualification: "M.Ed. Educational Management, B.Sc. Ed",
    status: "Active",
    employmentDate: "2018-09-15"
  },
  {
    name: "Mrs Esther U. Freely",
    staffId: "NDA/STF/002",
    email: "vp.academics@ndastaffschool.edu.ng",
    phone: "08029876543",
    gender: "Female",
    role: "Vice Principal (Academics)",
    department: "School Administration",
    subjects: ["English Language", "Literature in English"],
    classes: ["SSS 3 Art", "SSS 3 Science"],
    qualification: "M.A. English, B.A. Ed",
    status: "Active",
    employmentDate: "2019-01-10"
  },
  {
    name: "Mr. Haruna Danladi",
    staffId: "NDA/STF/003",
    email: "haruna.danladi@ndastaffschool.edu.ng",
    phone: "08055551234",
    gender: "Male",
    role: "Head of Department (HOD)",
    department: "Sciences",
    subjects: ["Mathematics", "Further Mathematics"],
    classes: ["SSS 2 Science", "SSS 3 Science"],
    qualification: "B.Sc. Mathematics, PGDE",
    status: "Active",
    employmentDate: "2020-03-01"
  },
  {
    name: "Mrs. Amina Garba",
    staffId: "NDA/STF/004",
    email: "amina.garba@ndastaffschool.edu.ng",
    phone: "08061112233",
    gender: "Female",
    role: "Head of Department (HOD)",
    department: "Arts & Humanities",
    subjects: ["English Language"],
    classes: ["SSS 1 Science", "SSS 1 Art", "SSS 1 Commerce"],
    qualification: "B.Ed. English, TRCN Certified",
    status: "Active",
    employmentDate: "2020-09-01"
  },
  {
    name: "Mr. Samuel Adebayo",
    staffId: "NDA/STF/005",
    email: "samuel.adebayo@ndastaffschool.edu.ng",
    phone: "08078901234",
    gender: "Male",
    role: "Senior Teacher",
    department: "Sciences",
    subjects: ["Physics"],
    classes: ["SSS 1 Science", "SSS 2 Science", "SSS 3 Science"],
    qualification: "B.Tech. Applied Physics, PGDE",
    status: "Active",
    employmentDate: "2021-01-15"
  },
  {
    name: "Mrs. Fatima Mohammed",
    staffId: "NDA/STF/006",
    email: "fatima.m@ndastaffschool.edu.ng",
    phone: "08033334444",
    gender: "Female",
    role: "Form Master / Teacher",
    department: "Sciences",
    subjects: ["Chemistry"],
    classes: ["SSS 1 Science", "SSS 2 Science"],
    qualification: "B.Sc. Pure Chemistry, NCE",
    status: "Active",
    employmentDate: "2021-08-20"
  },
  {
    name: "Mr. Chinedu Eze",
    staffId: "NDA/STF/007",
    email: "chinedu.eze@ndastaffschool.edu.ng",
    phone: "08099887766",
    gender: "Male",
    role: "Subject Teacher",
    department: "Sciences",
    subjects: ["Biology"],
    classes: ["SSS 2 Science", "SSS 3 Science"],
    qualification: "B.Sc. Biology Ed",
    status: "Active",
    employmentDate: "2022-02-10"
  },
  {
    name: "Mal. Usman Bichi",
    staffId: "NDA/STF/008",
    email: "usman.bichi@ndastaffschool.edu.ng",
    phone: "08034445566",
    gender: "Male",
    role: "ICT & CBT Coordinator",
    department: "Sciences",
    subjects: ["Computer Science / ICT"],
    classes: ["JSS 1A", "JSS 2A", "SSS 1 Science"],
    qualification: "B.Sc. Computer Science, Cisco CCNA",
    status: "Active",
    employmentDate: "2022-09-01"
  },
  {
    name: "Mrs. Rebecca Audu",
    staffId: "NDA/STF/009",
    email: "bursar@ndastaffschool.edu.ng",
    phone: "08022223344",
    gender: "Female",
    role: "Bursar / Accountant",
    department: "Bursary & Accounts",
    subjects: ["Financial Accounting"],
    classes: ["SSS 2 Commerce", "SSS 3 Commerce"],
    qualification: "B.Sc. Accounting, ICAN",
    status: "Active",
    employmentDate: "2019-11-01"
  }
];

export default function AdminStaff() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [staffId, setStaffId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Male');
  const [role, setRole] = useState(ROLES[5]);
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [qualification, setQualification] = useState('');
  const [status, setStatus] = useState('Active');
  const [employmentDate, setEmploymentDate] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [passportPhoto, setPassportPhoto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  // CSV Import States
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<Partial<StaffMember>[]>([]);
  const [importFileName, setImportFileName] = useState('');
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Staff ID': 'NDA/STF/010',
        'Full Name': 'Muhammad Kabir Bello',
        'Email': 'kabir.bello@ndastaffschool.edu.ng',
        'Phone': '08031234567',
        'Gender': 'Male',
        'Role': 'Subject Teacher',
        'Department': 'Sciences',
        'Subjects': 'Mathematics, Further Mathematics',
        'Classes': 'SSS 1 Science, SSS 2 Science',
        'Qualification': 'B.Sc. Ed Mathematics, TRCN',
        'Status': 'Active',
        'Employment Date': '2023-09-01'
      },
      {
        'Staff ID': 'NDA/STF/011',
        'Full Name': 'Aisha Grace Ibrahim',
        'Email': 'aisha.ibrahim@ndastaffschool.edu.ng',
        'Phone': '08029876543',
        'Gender': 'Female',
        'Role': 'Senior Teacher',
        'Department': 'Arts & Humanities',
        'Subjects': 'English Language, Literature in English',
        'Classes': 'JSS 3A, SSS 1 Art',
        'Qualification': 'B.A. English, PGDE',
        'Status': 'Active',
        'Employment Date': '2022-01-15'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Staff Template");
    XLSX.writeFile(workbook, "NDA_Staff_Bulk_Import_Template.csv");
    toast.success("CSV template downloaded successfully!");
  };

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    setImportFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          toast.error("The selected file is empty or formatted incorrectly.");
          setIsProcessingFile(false);
          return;
        }

        const mappedRecords: Partial<StaffMember>[] = rawJson.map((row, index) => {
          const getVal = (...keys: string[]) => {
            for (const k of keys) {
              const matchedKey = Object.keys(row).find(
                rk => rk.toLowerCase().trim().replace(/[\s_-]/g, '') === k.toLowerCase().trim().replace(/[\s_-]/g, '')
              );
              if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== '') {
                return String(row[matchedKey]).trim();
              }
            }
            return '';
          };

          const staffName = getVal('name', 'fullname', 'staffname', 'instructor');
          let sId = getVal('staffid', 'id', 'fileno', 'staffno');
          if (!sId) {
            sId = `NDA/STF/${String(staffList.length + index + 1).padStart(3, '0')}`;
          }

          const rawGender = getVal('gender', 'sex').toLowerCase();
          const cleanGender = rawGender.startsWith('f') ? 'Female' : 'Male';

          const rawStatus = getVal('status').toLowerCase();
          let cleanStatus: 'Active' | 'On Leave' | 'Inactive' = 'Active';
          if (rawStatus.includes('leave')) cleanStatus = 'On Leave';
          else if (rawStatus.includes('inact') || rawStatus.includes('susp')) cleanStatus = 'Inactive';

          const rawSubjects = getVal('subjects', 'subject', 'courses');
          const parsedSubjects = rawSubjects 
            ? rawSubjects.split(/[,;|]/).map((s: string) => s.trim()).filter(Boolean)
            : [];

          const rawClasses = getVal('classes', 'class', 'arms');
          const parsedClasses = rawClasses 
            ? rawClasses.split(/[,;|]/).map((c: string) => c.trim()).filter(Boolean)
            : [];

          return {
            name: staffName,
            staffId: sId,
            email: getVal('email', 'emailaddress'),
            phone: getVal('phone', 'phonenumber', 'mobile', 'telephone'),
            gender: cleanGender,
            role: getVal('role', 'designation', 'position') || 'Subject Teacher',
            department: getVal('department', 'dept') || 'Sciences',
            qualification: getVal('qualification', 'degree', 'credentials') || 'B.Sc. Ed',
            subjects: parsedSubjects,
            classes: parsedClasses,
            status: cleanStatus,
            employmentDate: getVal('employmentdate', 'datehired', 'date') || new Date().toISOString().split('T')[0]
          };
        }).filter(r => Boolean(r.name));

        if (mappedRecords.length === 0) {
          toast.error("No valid staff records found in the file. Please ensure there is a 'Full Name' column.");
          setIsProcessingFile(false);
          return;
        }

        setImportPreview(mappedRecords);
        toast.success(`Successfully parsed ${mappedRecords.length} staff records from CSV! Review and confirm upload below.`);
      } catch (err: any) {
        console.error("CSV parse error:", err);
        toast.error(`Failed to parse file: ${err.message || 'Check CSV format'}`);
      } finally {
        setIsProcessingFile(false);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleCommitBulkImport = async () => {
    if (importPreview.length === 0) return;

    setIsImporting(true);
    const toastId = toast.loading(`Importing ${importPreview.length} staff records to Firestore database...`);

    try {
      const staffColRef = collection(db, 'staff');
      const batchSize = 400;

      for (let i = 0; i < importPreview.length; i += batchSize) {
        const chunk = importPreview.slice(i, i + batchSize);
        const batch = writeBatch(db);

        for (const stf of chunk) {
          const newDocRef = doc(staffColRef);
          batch.set(newDocRef, {
            ...stf,
            passportPhoto: stf.passportPhoto || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }

        await batch.commit();
      }

      toast.dismiss(toastId);
      toast.success(`Successfully added ${importPreview.length} staff members to the directory!`);
      setIsImportOpen(false);
      setImportPreview([]);
      setImportFileName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (error: any) {
      console.error("Bulk staff import failed:", error);
      toast.dismiss(toastId);
      toast.error(`Bulk import failed: ${error.message || 'Please check your connection and retry.'}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Photo processing
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, 300, 360);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setPassportPhoto(dataUrl);
          toast.success("Passport photo processed successfully!");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Real-time listener
  useEffect(() => {
    const q = query(collection(db, 'staff'), orderBy('staffId', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }) as StaffMember)
        .filter(stf => 
          stf.name && stf.name.trim() !== '' && 
          stf.passportPhoto && stf.passportPhoto.trim() !== ''
        );
      setStaffList(items);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching staff:", error);
      toast.error('Unable to fetch staff records from database.');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Quick Seed initial staff if database is empty
  const handleSeedStaff = async () => {
    setIsSeeding(true);
    try {
      const batch = writeBatch(db);
      for (const stf of INITIAL_STAFF_SEEDS) {
        const newDocRef = doc(collection(db, 'staff'));
        batch.set(newDocRef, {
          ...stf,
          createdAt: serverTimestamp()
        });
      }
      await batch.commit();
      toast.success("Official NDA Staff members populated successfully!");
    } catch (err: any) {
      console.error("Error seeding staff:", err);
      toast.error("Failed to seed staff: " + (err.message || 'Unknown error'));
    } finally {
      setIsSeeding(false);
    }
  };

  const resetForm = () => {
    setName('');
    setStaffId(`NDA/STF/${String(staffList.length + 1).padStart(3, '0')}`);
    setEmail('');
    setPhone('');
    setGender('Male');
    setRole(ROLES[5]);
    setDepartment(DEPARTMENTS[0]);
    setQualification('');
    setStatus('Active');
    setEmploymentDate(new Date().toISOString().split('T')[0]);
    setSelectedSubjects([]);
    setSelectedClasses([]);
    setPassportPhoto('');
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (member: StaffMember) => {
    setSelectedStaff(member);
    setName(member.name);
    setStaffId(member.staffId);
    setEmail(member.email || '');
    setPhone(member.phone || '');
    setGender(member.gender || 'Male');
    setRole(member.role);
    setDepartment(member.department);
    setQualification(member.qualification || '');
    setStatus(member.status || 'Active');
    setEmploymentDate(member.employmentDate || '');
    setSelectedSubjects(member.subjects || []);
    setSelectedClasses(member.classes || []);
    setPassportPhoto(member.passportPhoto || '');
    setIsEditOpen(true);
  };

  const handleOpenDelete = (member: StaffMember) => {
    setSelectedStaff(member);
    setIsDeleteOpen(true);
  };

  const handleOpenView = (member: StaffMember) => {
    setSelectedStaff(member);
    setIsViewOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !staffId.trim()) {
      toast.error("Name and Staff ID are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'staff'), {
        name: name.trim(),
        staffId: staffId.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        gender,
        role,
        department,
        qualification: qualification.trim(),
        status,
        employmentDate: employmentDate || new Date().toISOString().split('T')[0],
        subjects: selectedSubjects,
        classes: selectedClasses,
        passportPhoto,
        createdAt: serverTimestamp()
      });
      toast.success("Staff member created successfully!");
      setIsAddOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Error creating staff:", err);
      toast.error("Failed to create staff: " + (err.message || 'Check database permissions'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaff) return;
    if (!name.trim() || !staffId.trim()) {
      toast.error("Name and Staff ID are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, 'staff', selectedStaff.id), {
        name: name.trim(),
        staffId: staffId.trim().toUpperCase(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        gender,
        role,
        department,
        qualification: qualification.trim(),
        status,
        employmentDate: employmentDate || selectedStaff.employmentDate,
        subjects: selectedSubjects,
        classes: selectedClasses,
        passportPhoto,
        updatedAt: serverTimestamp()
      });
      toast.success("Staff profile updated successfully!");
      setIsEditOpen(false);
    } catch (err: any) {
      console.error("Error updating staff:", err);
      toast.error("Failed to update staff: " + (err.message || 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStaff) return;
    setIsSubmitting(true);
    try {
      await deleteDoc(doc(db, 'staff', selectedStaff.id));
      toast.success("Staff member removed successfully.");
      setIsDeleteOpen(false);
    } catch (err: any) {
      console.error("Error deleting staff:", err);
      toast.error("Failed to delete staff: " + (err.message || 'Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSubject = (subj: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subj) ? prev.filter(s => s !== subj) : [...prev, subj]
    );
  };

  const toggleClass = (cls: string) => {
    setSelectedClasses(prev => 
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
    );
  };

  // Filter staff
  const filteredStaff = staffList.filter(stf => {
    const matchesSearch = 
      stf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stf.staffId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stf.email && stf.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (stf.phone && stf.phone.includes(searchTerm));
    
    const matchesDept = departmentFilter === 'all' || stf.department === departmentFilter;
    const matchesRole = roleFilter === 'all' || stf.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || stf.status === statusFilter;

    return matchesSearch && matchesDept && matchesRole && matchesStatus;
  });

  const teachingCount = staffList.filter(s => s.role.includes('Teacher') || s.role.includes('HOD') || s.role.includes('Master')).length;
  const adminCount = staffList.length - teachingCount;

  const handleExportExcel = () => {
    try {
      const dataToExport = filteredStaff.map(s => ({
        'Staff ID': s.staffId,
        'Full Name': s.name,
        'Email': s.email,
        'Phone': s.phone,
        'Gender': s.gender,
        'Role': s.role,
        'Department': s.department,
        'Subjects': (s.subjects || []).join(', '),
        'Classes': (s.classes || []).join(', '),
        'Qualification': s.qualification || '',
        'Status': s.status || 'Active',
        'Employment Date': s.employmentDate || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Staff Directory");
      XLSX.writeFile(workbook, `NDA_Staff_Directory_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Staff directory exported to Excel successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export staff directory to Excel.");
    }
  };

  const handleExportPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Staff & Faculty Directory
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Manage academic instructors, departmental heads, administrative officers, and staff records.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {staffList.length === 0 && !isLoading && (
            <Button 
              variant="outline" 
              onClick={handleSeedStaff} 
              disabled={isSeeding}
              className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 text-xs font-semibold"
            >
              {isSeeding ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1.5" />}
              Seed Initial NDA Staff
            </Button>
          )}
          <Button 
            onClick={handleExportExcel}
            variant="outline"
            className="border-emerald-300 hover:bg-emerald-50 text-emerald-700 text-xs font-semibold px-3.5 shadow-2xs flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export Excel
          </Button>
          <Button 
            onClick={handleExportPdf}
            variant="outline"
            className="border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 shadow-2xs flex items-center gap-1.5 print:hidden"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            Export PDF
          </Button>
          <Button 
            onClick={() => setIsImportOpen(true)}
            variant="outline"
            className="border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold px-3.5 shadow-2xs flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4 text-emerald-600" />
            Import Staff CSV
          </Button>
          <Button 
            onClick={handleOpenAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 shadow-sm"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Staff</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{staffList.length}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Staff</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{teachingCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin & Support</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{adminCount}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200/80 shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Status</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {staffList.filter(s => s.status === 'Active').length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <UserCheck className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-white border-slate-200/80 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Search */}
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search staff by name, ID, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            {/* Department Filter */}
            <div>
              <Select value={departmentFilter} onValueChange={(val: string) => setDepartmentFilter(val)}>
                <SelectTrigger className="text-xs w-full">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {DEPARTMENTS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Role Filter */}
            <div>
              <Select value={roleFilter} onValueChange={(val: string) => setRoleFilter(val)}>
                <SelectTrigger className="text-xs w-full">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {ROLES.map(r => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <Select value={statusFilter} onValueChange={(val: string) => setStatusFilter(val)}>
                <SelectTrigger className="text-xs w-full">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="On Leave">On Leave</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card className="bg-white border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b border-slate-200/80">
                <TableHead className="w-14 text-xs font-bold text-slate-600">Photo</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Staff ID</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Full Name</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Role & Title</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Department</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Subjects / Classes</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Contact</TableHead>
                <TableHead className="text-xs font-bold text-slate-600">Status</TableHead>
                <TableHead className="text-right text-xs font-bold text-slate-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Loading faculty records...</p>
                  </TableCell>
                </TableRow>
              ) : filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-slate-500">
                    <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-700">No staff members found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm || departmentFilter !== 'all' 
                        ? "Try clearing your filters or search terms." 
                        : "Click 'Add Staff Member' or 'Seed Initial NDA Staff' to get started."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((member) => (
                  <TableRow key={member.id} className="hover:bg-slate-50/60 transition-colors">
                    <TableCell>
                      <div className="w-9 h-9 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0">
                        {member.passportPhoto ? (
                          <img src={member.passportPhoto} alt={member.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-slate-500">
                            {member.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs font-bold text-blue-700">
                      {member.staffId}
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-xs text-slate-900">{member.name}</div>
                      <div className="text-[10px] text-slate-400">{member.gender} · {member.qualification || 'Educator'}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal text-[11px] bg-slate-50 border-slate-200 text-slate-700">
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {member.department}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {member.subjects && member.subjects.length > 0 ? (
                          member.subjects.slice(0, 2).map((s, idx) => (
                            <span key={idx} className="bg-blue-50 text-blue-700 text-[10px] px-1.5 py-0.5 rounded font-medium">
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-slate-400">None assigned</span>
                        )}
                        {member.subjects && member.subjects.length > 2 && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            +{member.subjects.length - 2}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-[11px] text-slate-700 font-medium">{member.phone || '—'}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{member.email || '—'}</div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        member.status === 'Active' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : member.status === 'On Leave'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {member.status || 'Active'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenView(member)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                          title="View Profile"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenEdit(member)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-amber-600 hover:bg-amber-50"
                          title="Edit Profile"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleOpenDelete(member)}
                          className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          title="Remove Staff"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add Staff Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" />
              Add New Staff Member
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Register a new faculty or administrative staff record in the school database.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Full Name *</Label>
                <Input 
                  placeholder="e.g. Dr. Aliyu Mohammed" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Staff ID *</Label>
                <Input 
                  placeholder="e.g. NDA/STF/012" 
                  value={staffId} 
                  onChange={(e) => setStaffId(e.target.value)} 
                  required 
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Email Address</Label>
                <Input 
                  type="email"
                  placeholder="staff@ndastaffschool.edu.ng" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Phone Number</Label>
                <Input 
                  placeholder="08012345678" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Role / Position *</Label>
                <Select value={role} onValueChange={(val: string) => setRole(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Department *</Label>
                <Select value={department} onValueChange={(val: string) => setDepartment(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Gender</Label>
                <Select value={gender} onValueChange={(val: string) => setGender(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Status</Label>
                <Select value={status} onValueChange={(val: string) => setStatus(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Educational Qualification</Label>
                <Input 
                  placeholder="e.g. B.Sc. Ed (Mathematics), PGDE" 
                  value={qualification} 
                  onChange={(e) => setQualification(e.target.value)} 
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Date Joined</Label>
                <Input 
                  type="date"
                  value={employmentDate} 
                  onChange={(e) => setEmploymentDate(e.target.value)} 
                  className="text-xs"
                />
              </div>
            </div>

            {/* Passport Photo */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <Label className="text-xs font-semibold">Passport Photo</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-20 rounded border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                  {passportPhoto ? (
                    <img src={passportPhoto} alt="Passport preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-slate-400 text-center">No Photo</span>
                  )}
                </div>
                <div className="flex-1">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                    className="text-xs" 
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Recommended: 300x360 pixels. Max 2MB.</p>
                </div>
              </div>
            </div>

            {/* Subjects Multi-select */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <Label className="text-xs font-semibold">Subjects Taught (Select all that apply)</Label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-md bg-slate-50/50">
                {ALL_SUBJECTS.map((subj) => {
                  const isSelected = selectedSubjects.includes(subj);
                  return (
                    <button
                      type="button"
                      key={subj}
                      onClick={() => toggleSubject(subj)}
                      className={`text-[11px] px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                        isSelected 
                          ? 'bg-blue-600 text-white font-semibold' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {subj}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Classes Multi-select */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <Label className="text-xs font-semibold">Assigned Classes</Label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 border border-slate-200 rounded-md bg-slate-50/50">
                {ALL_CLASSES.map((cls) => {
                  const isSelected = selectedClasses.includes(cls);
                  return (
                    <button
                      type="button"
                      key={cls}
                      onClick={() => toggleClass(cls)}
                      className={`text-[11px] px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                        isSelected 
                          ? 'bg-emerald-600 text-white font-semibold' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {cls}
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                Save Staff Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Modal */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Edit className="w-5 h-5 text-amber-600" />
              Edit Staff Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Update credentials and instructional details for {selectedStaff?.name}.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdate} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Full Name *</Label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Staff ID *</Label>
                <Input 
                  value={staffId} 
                  onChange={(e) => setStaffId(e.target.value)} 
                  required 
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Email Address</Label>
                <Input 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Phone Number</Label>
                <Input 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Role / Position *</Label>
                <Select value={role} onValueChange={(val: string) => setRole(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Department *</Label>
                <Select value={department} onValueChange={(val: string) => setDepartment(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Gender</Label>
                <Select value={gender} onValueChange={(val: string) => setGender(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Status</Label>
                <Select value={status} onValueChange={(val: string) => setStatus(val)}>
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Leave">On Leave</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Qualification</Label>
                <Input 
                  value={qualification} 
                  onChange={(e) => setQualification(e.target.value)} 
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Date Joined</Label>
                <Input 
                  type="date"
                  value={employmentDate} 
                  onChange={(e) => setEmploymentDate(e.target.value)} 
                  className="text-xs"
                />
              </div>
            </div>

            {/* Passport Photo */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <Label className="text-xs font-semibold">Update Passport Photo</Label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-20 rounded border border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                  {passportPhoto ? (
                    <img src={passportPhoto} alt="Passport preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[10px] text-slate-400 text-center">No Photo</span>
                  )}
                </div>
                <div className="flex-1">
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handlePhotoUpload} 
                    className="text-xs" 
                  />
                  {passportPhoto && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setPassportPhoto('')}
                      className="text-rose-600 text-xs h-7 mt-1 p-0"
                    >
                      Remove Photo
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Subjects Multi-select */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <Label className="text-xs font-semibold">Subjects Taught</Label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-md bg-slate-50/50">
                {ALL_SUBJECTS.map((subj) => {
                  const isSelected = selectedSubjects.includes(subj);
                  return (
                    <button
                      type="button"
                      key={subj}
                      onClick={() => toggleSubject(subj)}
                      className={`text-[11px] px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                        isSelected 
                          ? 'bg-blue-600 text-white font-semibold' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {subj}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Classes Multi-select */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <Label className="text-xs font-semibold">Assigned Classes</Label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 border border-slate-200 rounded-md bg-slate-50/50">
                {ALL_CLASSES.map((cls) => {
                  const isSelected = selectedClasses.includes(cls);
                  return (
                    <button
                      type="button"
                      key={cls}
                      onClick={() => toggleClass(cls)}
                      className={`text-[11px] px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                        isSelected 
                          ? 'bg-emerald-600 text-white font-semibold' 
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                      {cls}
                    </button>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white text-xs">
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Save className="w-3.5 h-3.5 mr-1.5" />}
                Update Profile
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Staff Profile Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Staff Profile Card
            </DialogTitle>
          </DialogHeader>

          {selectedStaff && (
            <div className="space-y-5 pt-2">
              {/* Profile Card Header */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-blue-600 bg-white overflow-hidden shadow-md flex items-center justify-center shrink-0">
                  {selectedStaff.passportPhoto ? (
                    <img src={selectedStaff.passportPhoto} alt={selectedStaff.name} className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-8 h-8 text-slate-300" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{selectedStaff.name}</h3>
                  <p className="text-xs font-mono font-bold text-blue-600 mt-0.5">{selectedStaff.staffId}</p>
                  <p className="text-xs font-semibold text-slate-600 mt-1">{selectedStaff.role}</p>
                  <p className="text-[11px] text-slate-500">{selectedStaff.department}</p>
                </div>
              </div>

              {/* Profile Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Gender</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedStaff.gender || 'Not specified'}</p>
                </div>

                <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Status</p>
                  <p className="font-semibold text-emerald-600 mt-0.5">{selectedStaff.status || 'Active'}</p>
                </div>

                <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Phone</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedStaff.phone || '—'}</p>
                </div>

                <div className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Date Joined</p>
                  <p className="font-semibold text-slate-800 mt-0.5">{selectedStaff.employmentDate || '—'}</p>
                </div>
              </div>

              {/* Qualification */}
              {selectedStaff.qualification && (
                <div className="text-xs bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Qualification</p>
                  <p className="font-medium text-slate-800 mt-0.5">{selectedStaff.qualification}</p>
                </div>
              )}

              {/* Assigned Subjects */}
              <div className="text-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Assigned Subjects</p>
                <div className="flex flex-wrap gap-1">
                  {selectedStaff.subjects && selectedStaff.subjects.length > 0 ? (
                    selectedStaff.subjects.map((s, i) => (
                      <span key={i} className="bg-blue-50 text-blue-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs">No subjects assigned</span>
                  )}
                </div>
              </div>

              {/* Assigned Classes */}
              <div className="text-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-1.5">Assigned Classes</p>
                <div className="flex flex-wrap gap-1">
                  {selectedStaff.classes && selectedStaff.classes.length > 0 ? (
                    selectedStaff.classes.map((c, i) => (
                      <span key={i} className="bg-emerald-50 text-emerald-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                        {c}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 text-xs">No classes assigned</span>
                  )}
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button onClick={() => setIsViewOpen(false)} className="w-full text-xs bg-slate-800 hover:bg-slate-900">
                  Close Card
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-rose-600 flex items-center gap-2">
              <Trash2 className="w-5 h-5" />
              Remove Staff Member
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600 pt-2">
              Are you sure you want to remove <span className="font-bold text-slate-900">{selectedStaff?.name}</span> ({selectedStaff?.staffId})? This action will remove their record from the school portal.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4 gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} className="text-xs">
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={isSubmitting}
              className="text-xs bg-rose-600 hover:bg-rose-700"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1.5" />}
              Yes, Remove Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CSV / Excel Bulk Staff Import Modal */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900">
                  Bulk Import Staff Directory
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500">
                  Upload a CSV or Excel spreadsheet to rapidly add multiple faculty, instructors, and administrative staff.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 pt-3">
            {/* Step 1: Download Template Helper */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-slate-800">Need the standard spreadsheet format?</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Columns: Staff ID, Full Name, Email, Phone, Gender, Role, Department, Subjects, Classes, Qualification, Status, Employment Date.
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="shrink-0 text-xs border-blue-200 text-blue-700 hover:bg-blue-50 font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download CSV Template
              </Button>
            </div>

            {/* Step 2: Upload File Area */}
            <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".csv, .xlsx, .xls" 
                onChange={handleCsvFileUpload}
                className="hidden" 
                id="staff-csv-input"
              />
              <label 
                htmlFor="staff-csv-input"
                className="cursor-pointer flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-bold text-blue-600 hover:underline">
                    Click to choose CSV or Excel file
                  </span>
                  <p className="text-xs text-slate-400 mt-0.5">Supports .csv, .xlsx, or .xls files</p>
                </div>
                {importFileName && (
                  <Badge variant="outline" className="mt-2 bg-white text-emerald-700 border-emerald-300 font-mono text-xs py-1 px-3">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    {importFileName}
                  </Badge>
                )}
              </label>
            </div>

            {isProcessingFile && (
              <div className="flex items-center justify-center gap-2 py-4 text-xs font-semibold text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                Parsing staff records from file...
              </div>
            )}

            {/* Step 3: Parsed Data Preview Table */}
            {importPreview.length > 0 && !isProcessingFile && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Parsed Preview:
                    </span>
                    <Badge className="bg-emerald-600 text-white text-[11px] font-bold">
                      {importPreview.length} Staff Members Found
                    </Badge>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setImportPreview([]);
                      setImportFileName('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs text-slate-500 hover:text-rose-600 h-7"
                  >
                    Clear Preview
                  </Button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                  <Table className="text-xs">
                    <TableHeader className="bg-slate-100 text-slate-700 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Staff ID</TableHead>
                        <TableHead>Full Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Subjects</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.slice(0, 30).map((row, idx) => (
                        <TableRow key={idx} className="hover:bg-slate-50">
                          <TableCell className="font-mono text-slate-400">{idx + 1}</TableCell>
                          <TableCell className="font-mono font-bold text-slate-700">{row.staffId}</TableCell>
                          <TableCell className="font-semibold text-slate-900">{row.name}</TableCell>
                          <TableCell className="text-slate-600">{row.role}</TableCell>
                          <TableCell className="text-slate-600">{row.department}</TableCell>
                          <TableCell className="text-slate-600">{row.gender}</TableCell>
                          <TableCell className="text-slate-600 max-w-[150px] truncate" title={row.subjects?.join(', ')}>
                            {row.subjects && row.subjects.length > 0 ? row.subjects.join(', ') : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {importPreview.length > 30 && (
                  <p className="text-[11px] text-slate-400 text-center italic">
                    Showing first 30 of {importPreview.length} records. All records will be imported.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsImportOpen(false);
                setImportPreview([]);
                setImportFileName('');
              }}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCommitBulkImport}
              disabled={importPreview.length === 0 || isImporting || isProcessingFile}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Importing to Firestore...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 mr-2" />
                  Confirm & Import ({importPreview.length}) Staff
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
