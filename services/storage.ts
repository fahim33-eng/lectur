import AsyncStorage from '@react-native-async-storage/async-storage';
import { Student, ClassEntry, OneTimeSchedule, FeeEntry } from '@/types';

const STUDENTS_KEY = '@lectur:students';
const CLASS_ENTRIES_KEY = '@lectur:classEntries';
const ONE_TIME_SCHEDULES_KEY = '@lectur:oneTimeSchedules';
const FEE_ENTRIES_KEY = '@lectur:feeEntries';

export const storageService = {
  // Students
  async getStudents(): Promise<Student[]> {
    try {
      const data = await AsyncStorage.getItem(STUDENTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting students:', error);
      return [];
    }
  },

  async saveStudent(student: Student): Promise<void> {
    try {
      const students = await this.getStudents();
      const existingIndex = students.findIndex((s) => s.id === student.id);
      if (existingIndex >= 0) {
        students[existingIndex] = student;
      } else {
        students.push(student);
      }
      await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(students));
    } catch (error) {
      console.error('Error saving student:', error);
      throw error;
    }
  },

  async deleteStudent(studentId: string): Promise<void> {
    try {
      const students = await this.getStudents();
      const filtered = students.filter((s) => s.id !== studentId);
      await AsyncStorage.setItem(STUDENTS_KEY, JSON.stringify(filtered));
      // Also delete all class entries, one-time schedules, and fee entries for this student
      await this.deleteClassEntriesByStudentId(studentId);
      await this.deleteOneTimeSchedulesByStudentId(studentId);
      await this.deleteFeeEntriesByStudentId(studentId);
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  },

  // Class Entries
  async getClassEntries(studentId?: string): Promise<ClassEntry[]> {
    try {
      const data = await AsyncStorage.getItem(CLASS_ENTRIES_KEY);
      const entries: ClassEntry[] = data ? JSON.parse(data) : [];
      if (studentId) {
        return entries.filter((e) => e.studentId === studentId);
      }
      return entries;
    } catch (error) {
      console.error('Error getting class entries:', error);
      return [];
    }
  },

  async saveClassEntry(entry: ClassEntry): Promise<void> {
    try {
      const entries = await this.getClassEntries();
      entries.push(entry);
      await AsyncStorage.setItem(CLASS_ENTRIES_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving class entry:', error);
      throw error;
    }
  },

  async deleteClassEntry(entryId: string): Promise<void> {
    try {
      const entries = await this.getClassEntries();
      const filtered = entries.filter((e) => e.id !== entryId);
      await AsyncStorage.setItem(CLASS_ENTRIES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting class entry:', error);
      throw error;
    }
  },

  async deleteClassEntriesByStudentId(studentId: string): Promise<void> {
    try {
      const entries = await this.getClassEntries();
      const filtered = entries.filter((e) => e.studentId !== studentId);
      await AsyncStorage.setItem(CLASS_ENTRIES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting class entries:', error);
      throw error;
    }
  },

  // One-Time Schedules
  async getOneTimeSchedules(date?: string): Promise<OneTimeSchedule[]> {
    try {
      const data = await AsyncStorage.getItem(ONE_TIME_SCHEDULES_KEY);
      const schedules: OneTimeSchedule[] = data ? JSON.parse(data) : [];
      if (date) {
        return schedules.filter((s) => s.date === date);
      }
      return schedules;
    } catch (error) {
      console.error('Error getting one-time schedules:', error);
      return [];
    }
  },

  async saveOneTimeSchedule(schedule: OneTimeSchedule): Promise<void> {
    try {
      const schedules = await this.getOneTimeSchedules();
      const existingIndex = schedules.findIndex((s) => s.id === schedule.id);
      if (existingIndex >= 0) {
        schedules[existingIndex] = schedule;
      } else {
        schedules.push(schedule);
      }
      await AsyncStorage.setItem(ONE_TIME_SCHEDULES_KEY, JSON.stringify(schedules));
    } catch (error) {
      console.error('Error saving one-time schedule:', error);
      throw error;
    }
  },

  async deleteOneTimeSchedule(scheduleId: string): Promise<void> {
    try {
      const schedules = await this.getOneTimeSchedules();
      const filtered = schedules.filter((s) => s.id !== scheduleId);
      await AsyncStorage.setItem(ONE_TIME_SCHEDULES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting one-time schedule:', error);
      throw error;
    }
  },

  async deleteOneTimeSchedulesByStudentId(studentId: string): Promise<void> {
    try {
      const schedules = await this.getOneTimeSchedules();
      const filtered = schedules.filter((s) => s.studentId !== studentId);
      await AsyncStorage.setItem(ONE_TIME_SCHEDULES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting one-time schedules:', error);
      throw error;
    }
  },

  // Fee Entries
  async getFeeEntries(studentId?: string): Promise<FeeEntry[]> {
    try {
      const data = await AsyncStorage.getItem(FEE_ENTRIES_KEY);
      const entries: FeeEntry[] = data ? JSON.parse(data) : [];
      if (studentId) {
        return entries.filter((e) => e.studentId === studentId);
      }
      return entries;
    } catch (error) {
      console.error('Error getting fee entries:', error);
      return [];
    }
  },

  async saveFeeEntry(entry: FeeEntry): Promise<void> {
    try {
      const entries = await this.getFeeEntries();
      const existingIndex = entries.findIndex((e) => e.id === entry.id);
      if (existingIndex >= 0) {
        entries[existingIndex] = entry;
      } else {
        entries.push(entry);
      }
      await AsyncStorage.setItem(FEE_ENTRIES_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving fee entry:', error);
      throw error;
    }
  },

  async deleteFeeEntry(entryId: string): Promise<void> {
    try {
      const entries = await this.getFeeEntries();
      const filtered = entries.filter((e) => e.id !== entryId);
      await AsyncStorage.setItem(FEE_ENTRIES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting fee entry:', error);
      throw error;
    }
  },

  async deleteFeeEntriesByStudentId(studentId: string): Promise<void> {
    try {
      const entries = await this.getFeeEntries();
      const filtered = entries.filter((e) => e.studentId !== studentId);
      await AsyncStorage.setItem(FEE_ENTRIES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting fee entries:', error);
      throw error;
    }
  },
};

