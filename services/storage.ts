import AsyncStorage from '@react-native-async-storage/async-storage';
import { Student, ClassEntry } from '@/types';

const STUDENTS_KEY = '@lectur:students';
const CLASS_ENTRIES_KEY = '@lectur:classEntries';

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
      // Also delete all class entries for this student
      await this.deleteClassEntriesByStudentId(studentId);
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
};

