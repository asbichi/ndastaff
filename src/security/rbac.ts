/**
 * Core Security and Data Access Controller: Role-Based Access Control (RBAC)
 * NDA Staff Secondary School Management System
 */

export type UserRole = 
  | 'exam_officer'
  | 'bursar'
  | 'parent'
  | 'student'
  | 'admin'
  | 'pta_financial_secretary';

export const STANDARD_DENIAL_MESSAGE = "Access Denied: You do not have the required permissions to view this section.";

export interface RBACPolicy {
  role: UserRole;
  title: string;
  allowedRoutes: string[];
  forbiddenRoutes: string[];
}

export const RBAC_POLICIES: Record<UserRole, RBACPolicy> = {
  exam_officer: {
    role: 'exam_officer',
    title: 'Examination Officer',
    allowedRoutes: [
      '/admin',
      '/admin/cbt',
      '/admin/cbt-results',
      '/admin/score-entry',
      '/admin/term-assessment',
      '/admin/reports',
      '/admin/bulk-reports',
      '/admin/exams',
      '/admin/broad-sheet',
      '/admin/time-table',
      '/admin/analysis'
    ],
    // Strictly prohibited from viewing financial records, school fees, payment histories, or the Bursary Section
    forbiddenRoutes: [
      '/admin/bursary',
      '/admin/financial-reports',
      '/admin/pta-payments',
      '/admin/fees',
      '/admin/settings',
      '/admin/gallery',
      '/admin/staff',
      '/admin/parents'
    ]
  },
  bursar: {
    role: 'bursar',
    title: 'Bursar',
    allowedRoutes: [
      '/admin',
      '/admin/bursary',
      '/admin/financial-reports',
      '/admin/pta-payments',
      '/admin/fees'
    ],
    // Strictly prohibited from viewing exam questions, academic grades, test scores, or the Examination Section
    forbiddenRoutes: [
      '/admin/cbt',
      '/admin/cbt-results',
      '/admin/score-entry',
      '/admin/term-assessment',
      '/admin/reports',
      '/admin/bulk-reports',
      '/admin/exams',
      '/admin/students',
      '/admin/classes',
      '/admin/broad-sheet',
      '/admin/time-table',
      '/admin/analysis',
      '/admin/gallery',
      '/admin/settings',
      '/admin/staff'
    ]
  },
  parent: {
    role: 'parent',
    title: 'Parent / Guardian',
    allowedRoutes: [
      '/student/dashboard',
      '/student/report',
      '/result',
      '/exam'
    ],
    // Strictly prohibited from viewing other students' results, administrative tools, exam creation panels, or global bursary ledgers
    forbiddenRoutes: [
      '/admin'
    ]
  },
  student: {
    role: 'student',
    title: 'Student',
    allowedRoutes: [
      '/student/dashboard',
      '/student/report',
      '/result',
      '/exam'
    ],
    forbiddenRoutes: [
      '/admin'
    ]
  },
  pta_financial_secretary: {
    role: 'pta_financial_secretary',
    title: 'PTA Financial Secretary',
    allowedRoutes: [
      '/admin/pta-payments'
    ],
    forbiddenRoutes: [
      '/admin/cbt',
      '/admin/cbt-results',
      '/admin/score-entry',
      '/admin/term-assessment',
      '/admin/reports',
      '/admin/bursary',
      '/admin/financial-reports',
      '/admin/exams'
    ]
  },
  admin: {
    role: 'admin',
    title: 'Super Administrator',
    allowedRoutes: ['*'],
    forbiddenRoutes: []
  }
};

/**
 * Validates if the given role is authorized to access the requested route path.
 */
export function checkRouteAccess(role: string, path: string): { 
  isAuthorized: boolean; 
  denialMessage: string; 
  reason?: string;
} {
  const normalizedPath = path.toLowerCase().replace(/\/$/, '') || '/';
  const userRole = (role as UserRole) || 'parent';

  // Super admin can access all admin sections
  if (userRole === 'admin') {
    return { isAuthorized: true, denialMessage: '' };
  }

  // Parents / Students are strictly prohibited from all administrative tools
  if (userRole === 'parent' || userRole === 'student') {
    if (normalizedPath.startsWith('/admin')) {
      return {
        isAuthorized: false,
        denialMessage: STANDARD_DENIAL_MESSAGE,
        reason: "Parent/Guardian accounts are strictly restricted to their designated child's report portal."
      };
    }
    return { isAuthorized: true, denialMessage: '' };
  }

  // Examination Officer security enforcement
  if (userRole === 'exam_officer') {
    const isFinancialRoute = 
      normalizedPath.includes('/bursary') ||
      normalizedPath.includes('/financial') ||
      normalizedPath.includes('/pta-payments') ||
      normalizedPath.includes('/fees');

    if (isFinancialRoute) {
      return {
        isAuthorized: false,
        denialMessage: STANDARD_DENIAL_MESSAGE,
        reason: "Role: Examination Officer is strictly prohibited from viewing financial records, school fees, payment histories, or the Bursary Section."
      };
    }
  }

  // Bursar security enforcement
  if (userRole === 'bursar') {
    const isExamRoute = 
      normalizedPath.includes('/cbt') ||
      normalizedPath.includes('/score-entry') ||
      normalizedPath.includes('/term-assessment') ||
      normalizedPath.includes('/reports') ||
      normalizedPath.includes('/exams') ||
      normalizedPath.includes('/broad-sheet') ||
      normalizedPath.includes('/analysis');

    if (isExamRoute) {
      return {
        isAuthorized: false,
        denialMessage: STANDARD_DENIAL_MESSAGE,
        reason: "Role: Bursar is strictly prohibited from viewing exam questions, academic grades, test scores, or the Examination Section."
      };
    }
  }

  // Check explicit policy
  const policy = RBAC_POLICIES[userRole];
  if (!policy) {
    return {
      isAuthorized: false,
      denialMessage: STANDARD_DENIAL_MESSAGE,
      reason: "Unrecognized user role."
    };
  }

  const isExplicitlyForbidden = policy.forbiddenRoutes.some(forbidden => 
    normalizedPath === forbidden || normalizedPath.startsWith(forbidden + '/')
  );

  if (isExplicitlyForbidden) {
    return {
      isAuthorized: false,
      denialMessage: STANDARD_DENIAL_MESSAGE
    };
  }

  return { isAuthorized: true, denialMessage: '' };
}

/**
 * Validates Parent/Guardian access to student data:
 * Must match the authenticated Student Registration Number.
 */
export function checkStudentDataAccess(
  authenticatedRegNo: string | undefined, 
  targetStudentRegNo: string
): { isAuthorized: boolean; denialMessage: string } {
  if (!authenticatedRegNo || authenticatedRegNo.trim().toUpperCase() !== targetStudentRegNo.trim().toUpperCase()) {
    return {
      isAuthorized: false,
      denialMessage: STANDARD_DENIAL_MESSAGE
    };
  }
  return { isAuthorized: true, denialMessage: '' };
}
