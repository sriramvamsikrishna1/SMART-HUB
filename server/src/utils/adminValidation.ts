export interface ProvisionStudentInput {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  batchYear: string;
  semester?: number;
  section?: string;
  password: string;
}

export interface ProvisionFacultyInput {
  facultyId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  specialization?: string;
  password: string;
}

export interface ProvisionAdminInput {
  adminCode: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string;
  password: string;
}

export interface ValidationOutcome<T> {
  isValid: boolean;
  error?: string;
  data?: T;
}

export function validateStudentInput(body: any): ValidationOutcome<ProvisionStudentInput> {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a JSON object.' };
  }

  const { studentId, firstName, lastName, email, department, batchYear, semester, section, password } = body;

  if (typeof studentId !== 'string' || !studentId.trim()) {
    return { isValid: false, error: 'studentId (Roll Number) is required.' };
  }

  if (typeof firstName !== 'string' || !firstName.trim()) {
    return { isValid: false, error: 'firstName is required.' };
  }

  if (typeof lastName !== 'string' || !lastName.trim()) {
    return { isValid: false, error: 'lastName is required.' };
  }

  if (typeof department !== 'string' || !department.trim()) {
    return { isValid: false, error: 'department is required.' };
  }

  if (typeof batchYear !== 'string' || !batchYear.trim()) {
    return { isValid: false, error: 'batchYear is required.' };
  }

  if (typeof password !== 'string' || password.length < 8) {
    return { isValid: false, error: 'password must be at least 8 characters.' };
  }

  let parsedSemester: number | undefined;
  if (semester !== undefined && semester !== null) {
    parsedSemester = parseInt(String(semester), 10);
    if (isNaN(parsedSemester) || parsedSemester < 1 || parsedSemester > 10) {
      return { isValid: false, error: 'semester must be an integer between 1 and 10.' };
    }
  }

  const trimmedId = studentId.trim();
  const resolvedEmail = email && typeof email === 'string' && email.trim()
    ? email.trim().toLowerCase()
    : `${trimmedId.toLowerCase()}@gist.edu.in`;

  return {
    isValid: true,
    data: {
      studentId: trimmedId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: resolvedEmail,
      department: department.trim(),
      batchYear: batchYear.trim(),
      semester: parsedSemester,
      section: typeof section === 'string' ? section.trim() : undefined,
      password
    }
  };
}

export function validateFacultyInput(body: any): ValidationOutcome<ProvisionFacultyInput> {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a JSON object.' };
  }

  const { facultyId, firstName, lastName, email, department, designation, specialization, password } = body;

  if (typeof facultyId !== 'string' || !facultyId.trim()) {
    return { isValid: false, error: 'facultyId (Faculty Code/Username) is required.' };
  }

  if (typeof firstName !== 'string' || !firstName.trim()) {
    return { isValid: false, error: 'firstName is required.' };
  }

  if (typeof lastName !== 'string' || !lastName.trim()) {
    return { isValid: false, error: 'lastName is required.' };
  }

  if (typeof department !== 'string' || !department.trim()) {
    return { isValid: false, error: 'department is required.' };
  }

  if (typeof designation !== 'string' || !designation.trim()) {
    return { isValid: false, error: 'designation is required.' };
  }

  if (typeof password !== 'string' || password.length < 8) {
    return { isValid: false, error: 'password must be at least 8 characters.' };
  }

  const trimmedId = facultyId.trim();
  const resolvedEmail = email && typeof email === 'string' && email.trim()
    ? email.trim().toLowerCase()
    : `${trimmedId.toLowerCase().replace(/[^a-z0-9]/g, '')}@gist.edu.in`;

  return {
    isValid: true,
    data: {
      facultyId: trimmedId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: resolvedEmail,
      department: department.trim(),
      designation: designation.trim(),
      specialization: typeof specialization === 'string' ? specialization.trim() : undefined,
      password
    }
  };
}

export function validateAdminInput(body: any): ValidationOutcome<ProvisionAdminInput> {
  if (!body || typeof body !== 'object') {
    return { isValid: false, error: 'Request body must be a JSON object.' };
  }

  const { adminCode, firstName, lastName, email, department, password } = body;

  if (typeof adminCode !== 'string' || !adminCode.trim()) {
    return { isValid: false, error: 'adminCode is required.' };
  }

  if (typeof firstName !== 'string' || !firstName.trim()) {
    return { isValid: false, error: 'firstName is required.' };
  }

  if (typeof lastName !== 'string' || !lastName.trim()) {
    return { isValid: false, error: 'lastName is required.' };
  }

  if (typeof email !== 'string' || !email.includes('@')) {
    return { isValid: false, error: 'A valid email address is required.' };
  }

  if (typeof password !== 'string' || password.length < 8) {
    return { isValid: false, error: 'password must be at least 8 characters.' };
  }

  return {
    isValid: true,
    data: {
      adminCode: adminCode.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      department: typeof department === 'string' ? department.trim() : undefined,
      password
    }
  };
}
