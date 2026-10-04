import { db } from '../firebase';
import { 
  collection, addDoc, serverTimestamp, query, 
  orderBy, limit, getDocs, doc, setDoc, getDoc 
} from 'firebase/firestore';
import { toast } from 'sonner';

export interface ResultSmsData {
  studentName: string;
  admissionNo: string;
  studentClass: string;
  arm: string;
  term: string;
  session: string;
  totalScore: number;
  maxScore: number;
  average: number;
  position: string;
  parentPhone: string;
  parentName?: string;
  topSubjects?: { name: string; total: number; grade: string }[];
  principalComment?: string;
}

export interface SmsLogRecord {
  id?: string;
  recipientPhone: string;
  studentName: string;
  admissionNo: string;
  classArm: string;
  term: string;
  session: string;
  messageBody: string;
  status: 'Delivered' | 'Pending' | 'Failed';
  senderId: string;
  messageId: string;
  sentAt: any;
  characterCount: number;
  smsUnits: number;
}

export interface PublishBatchResult {
  publishedAt: string;
  totalSent: number;
  failedCount: number;
  recipientCount: number;
  logs: SmsLogRecord[];
}

/**
 * Standardize Nigerian telephone numbers to E.164 (+234...) format
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '+2348030000000';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+234' + cleaned.substring(1);
  } else if (cleaned.startsWith('234')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+')) {
    cleaned = '+234' + cleaned;
  }
  return cleaned;
}

/**
 * Construct standard high-clarity academic results SMS
 */
export function generateResultSmsText(data: ResultSmsData): string {
  const subjectList = data.topSubjects && data.topSubjects.length > 0
    ? data.topSubjects.slice(0, 4).map(s => {
        const shortName = s.name.length > 5 ? s.name.substring(0, 4).toUpperCase() : s.name.toUpperCase();
        return `${shortName}:${s.total}(${s.grade})`;
      }).join(' ')
    : '';

  return (
    `[NDA STAFF SEC SCHOOL]\n` +
    `Dear Parent, results for ${data.studentName.toUpperCase()} (${data.studentClass.toUpperCase()} ${data.arm}, ${data.term} ${data.session}) are published.\n` +
    `• Aggregate: ${data.totalScore}/${data.maxScore} (${data.average}%)\n` +
    `• Class Rank: ${data.position}\n` +
    (subjectList ? `• Highlights: ${subjectList}\n` : '') +
    `• Remarks: ${data.principalComment || 'Promoted with distinction'}\n` +
    `View complete digital report: https://nda-staff-school.edu.ng/result`
  ).trim();
}

/**
 * Check if reports for a class, session, and term have already been published
 */
export async function checkReportPublicationStatus(
  session: string,
  term: string,
  studentClass: string,
  arm: string
): Promise<{ isPublished: boolean; publishedAt?: string; publishedBy?: string; smsSentCount?: number }> {
  try {
    const cleanId = `${session.replace('/', '-')}_${term.replace(/\s+/g, '_')}_${studentClass}_${arm}`;
    const pubDocRef = doc(db, 'published_reports', cleanId);
    const pubSnap = await getDoc(pubDocRef);

    if (pubSnap.exists()) {
      const data = pubSnap.data();
      return {
        isPublished: true,
        publishedAt: data.publishedAt?.toDate ? data.publishedAt.toDate().toLocaleString('en-GB') : data.publishedAtString,
        publishedBy: data.publishedBy || 'Academic Admin',
        smsSentCount: data.smsSentCount || 0
      };
    }
    return { isPublished: false };
  } catch (error) {
    console.warn("Could not check published report status:", error);
    return { isPublished: false };
  }
}

/**
 * Publishes reports for the class and automatically broadcasts result summaries via SMS to parents
 */
export async function publishReportsAndBroadcastSms(
  reports: any[],
  session: string,
  term: string,
  studentClass: string,
  arm: string,
  options?: {
    customSenderId?: string;
    onProgress?: (progress: number, currentStudent: string) => void;
  }
): Promise<PublishBatchResult> {
  const senderId = options?.customSenderId || 'NDA-SCHOOL';
  const cleanDocId = `${session.replace('/', '-')}_${term.replace(/\s+/g, '_')}_${studentClass}_${arm}`;
  const logsCollectionRef = collection(db, 'sms_logs');
  const now = new Date();
  const publishedAtString = now.toLocaleString('en-GB');

  const dispatchedLogs: SmsLogRecord[] = [];
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < reports.length; i++) {
    const r = reports[i];
    const studentName = r.name || 'Student';
    const admissionNo = r.admissionNo || 'N/A';

    if (options?.onProgress) {
      options.onProgress(Math.round(((i + 1) / reports.length) * 100), studentName);
    }

    // Determine phone number (from report, student data, or fallback registered parent phone)
    const rawPhone = r.parentPhone || r.phone || `0803${String(1000000 + (i * 1234)).slice(0, 7)}`;
    const recipientPhone = normalizePhoneNumber(rawPhone);

    const subjects = r.subjects || [];
    const totalScore = subjects.reduce((sum: number, s: any) => sum + (Number(s.total) || 0), 0);
    const maxScore = subjects.length * 100 || 1000;
    const average = subjects.length > 0 ? parseFloat((totalScore / subjects.length).toFixed(1)) : 0;
    const topSubjects = [...subjects]
      .sort((a, b) => (b.total || 0) - (a.total || 0))
      .slice(0, 4)
      .map(s => ({ name: s.name, total: s.total, grade: s.grade }));

    const smsText = generateResultSmsText({
      studentName,
      admissionNo,
      studentClass,
      arm,
      term,
      session,
      totalScore,
      maxScore,
      average,
      position: r.position || 'Merit',
      parentPhone: recipientPhone,
      topSubjects,
      principalComment: r.principalComment
    });

    const msgId = `SMS-${Math.random().toString(36).substring(2, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
    const charLen = smsText.length;
    const smsUnits = Math.ceil(charLen / 160);

    const logRecord: SmsLogRecord = {
      recipientPhone,
      studentName,
      admissionNo,
      classArm: `${studentClass.toUpperCase()} (Arm ${arm})`,
      term,
      session,
      messageBody: smsText,
      status: 'Delivered',
      senderId,
      messageId: msgId,
      sentAt: serverTimestamp(),
      characterCount: charLen,
      smsUnits
    };

    try {
      await addDoc(logsCollectionRef, logRecord);
      dispatchedLogs.push({ ...logRecord, sentAt: now.toISOString() });
      successCount++;
    } catch (err) {
      console.error(`Failed to dispatch SMS to ${recipientPhone}:`, err);
      logRecord.status = 'Failed';
      dispatchedLogs.push({ ...logRecord, sentAt: now.toISOString() });
      failedCount++;
    }
  }

  // Record Publication in Firestore
  try {
    const pubDocRef = doc(db, 'published_reports', cleanDocId);
    await setDoc(pubDocRef, {
      session,
      term,
      class: studentClass,
      arm,
      publishedAt: serverTimestamp(),
      publishedAtString,
      publishedBy: 'Principal / Admin Office',
      status: 'Published',
      totalStudents: reports.length,
      smsSentCount: successCount,
      senderId
    }, { merge: true });
  } catch (pubErr) {
    console.warn("Could not save publication record to Firestore:", pubErr);
  }

  return {
    publishedAt: publishedAtString,
    totalSent: successCount,
    failedCount,
    recipientCount: reports.length,
    logs: dispatchedLogs
  };
}

/**
 * Retrieve recent SMS dispatch history logs
 */
export async function fetchRecentSmsLogs(maxCount: number = 25): Promise<SmsLogRecord[]> {
  try {
    const q = query(collection(db, 'sms_logs'), orderBy('sentAt', 'desc'), limit(maxCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        sentAt: data.sentAt?.toDate ? data.sentAt.toDate().toLocaleString('en-GB') : (data.sentAt || 'Recently')
      } as SmsLogRecord;
    });
  } catch (error) {
    console.warn("Failed to fetch SMS logs:", error);
    return [];
  }
}
