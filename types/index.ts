export interface Student {
  id: string;
  name: string;
  weekdays: string[]; // e.g., ['Monday', 'Wednesday', 'Friday']
  times: Record<string, string>; // e.g., { 'Monday': '10:00', 'Wednesday': '14:30' } - 24h format
  classesPerCycle?: number; // Number of classes per cycle/month (default: 12)
  initialClassesCompleted?: number; // Number of classes already completed when adding student (default: 0)
  tuitionFee?: number; // Optional tuition fee per cycle/month
  mobileNumber?: string; // Optional mobile number (Bangladeshi format)
  createdAt: string;
}

export interface ClassEntry {
  id: string;
  studentId: string;
  date: string; // ISO date string
  createdAt: string;
  topics?: string; // Topics covered in this class
  remarks?: string; // Remarks/Homework assigned
}

export interface OneTimeSchedule {
  id: string;
  studentId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  time: string; // 24h format (HH:MM)
  createdAt: string;
}

export interface FeeEntry {
  id: string;
  studentId: string;
  studentName: string; // Store name for easier filtering
  amount: number; // Fee amount
  month: string; // Month/cycle identifier (e.g., "2024-01" or "Cycle 1")
  date: string; // ISO date string when fee was recorded
  status?: 'Payment Due' | 'Completed'; // Payment status (default: 'Payment Due')
  createdAt: string;
}

