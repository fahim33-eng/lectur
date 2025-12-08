export interface Student {
  id: string;
  name: string;
  weekdays: string[]; // e.g., ['Monday', 'Wednesday', 'Friday']
  times: Record<string, string>; // e.g., { 'Monday': '10:00', 'Wednesday': '14:30' } - 24h format
  classesPerCycle?: number; // Number of classes per cycle/month (default: 12)
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

