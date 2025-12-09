import { Student } from '@/types';
import { storageService } from './storage';

// Check if notifications are available
let Notifications: any = null;
let notificationsAvailable = false;

try {
  Notifications = require('expo-notifications');
  // Configure notification handler if available
  if (Notifications && Notifications.setNotificationHandler) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    notificationsAvailable = true;
  }
} catch (error) {
  console.log('Notifications not available in Expo Go. Use a development build for full notification support.');
  notificationsAvailable = false;
}

export const notificationService = {
  isAvailable(): boolean {
    return notificationsAvailable && Notifications !== null;
  },

  async requestPermissions(): Promise<boolean> {
    if (!this.isAvailable()) {
      console.log('Notifications not available in Expo Go');
      return false;
    }
    
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      return finalStatus === 'granted';
    } catch (error) {
      console.log('Error requesting notification permissions:', error);
      return false;
    }
  },

  async cancelAllNotifications(): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.log('Error canceling notifications:', error);
    }
  },

  async scheduleNotificationsForStudent(student: Student): Promise<void> {
    if (!this.isAvailable()) {
      console.log('Notifications not available - skipping scheduling');
      return;
    }

    try {
      // Cancel existing notifications for this student
      await this.cancelNotificationsForStudent(student.id);

      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      // Handle migration from old format
      let times = student.times;
      if (!times && (student as any).time) {
        // Migrate old single time to all weekdays
        const oldTime = (student as any).time;
        const time24h = this.convertTo24Hour(oldTime);
        times = {};
        student.weekdays.forEach(day => {
          times[day] = time24h;
        });
      }
      
      if (!times) return; // No times set
      
      for (const weekday of student.weekdays) {
        const timeStr = times[weekday];
        if (!timeStr) continue;

        const [hours, minutes] = timeStr.split(':').map(Number);
        const weekdayIndex = weekdays.indexOf(weekday);

        // Schedule for the next 4 weeks
        for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
          const notificationDate = this.getNextDateForWeekday(weekdayIndex, weekOffset, hours, minutes);
          
          // Schedule notification 1 hour before
          const notificationTime = new Date(notificationDate);
          notificationTime.setHours(notificationTime.getHours() - 1);

          // Only schedule if notification time is in the future
          if (notificationTime > new Date()) {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'Tuition Reminder',
                body: `You have a class with ${student.name} in 1 hour`,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
              },
              trigger: {
                type: 'date',
                date: notificationTime,
              },
              identifier: `student-${student.id}-${weekday}-${weekOffset}`,
            });
          }
        }
      }
    } catch (error) {
      console.log('Error scheduling notifications:', error);
    }
  },

  async cancelNotificationsForStudent(studentId: string): Promise<void> {
    if (!this.isAvailable()) return;
    
    try {
      const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const studentNotifications = allNotifications.filter(
        (n) => n.identifier.startsWith(`student-${studentId}-`)
      );
      
      for (const notification of studentNotifications) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    } catch (error) {
      console.log('Error canceling student notifications:', error);
    }
  },

  async rescheduleAllNotifications(): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      // Use Promise.allSettled to prevent one failure from blocking others
      await this.cancelAllNotifications();
      const students = await storageService.getStudents();
      
      // Schedule notifications in parallel with error handling
      const promises = students.map(student => 
        this.scheduleNotificationsForStudent(student).catch(error => {
          console.log(`Error scheduling notifications for ${student.name}:`, error);
          return null; // Continue with other students
        })
      );
      
      await Promise.allSettled(promises);
    } catch (error) {
      console.log('Error rescheduling notifications:', error);
      // Don't throw - allow app to continue
    }
  },

  getNextDateForWeekday(weekdayIndex: number, weekOffset: number, hours: number, minutes: number): Date {
    const today = new Date();
    const currentDay = today.getDay();
    let daysUntilWeekday = (weekdayIndex - currentDay + 7) % 7;
    
    // If it's the same day and time has passed, schedule for next week
    if (daysUntilWeekday === 0) {
      const todayTime = new Date();
      todayTime.setHours(hours, minutes, 0, 0);
      if (todayTime <= new Date()) {
        daysUntilWeekday = 7;
      }
    }
    
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + daysUntilWeekday + (weekOffset * 7));
    targetDate.setHours(hours, minutes, 0, 0);
    
    return targetDate;
  },

  convertTo24Hour(time12h: string): string {
    // Convert "10:00 AM" or "2:30 PM" to "10:00" or "14:30"
    const match = time12h.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return '10:00';
    
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  },
};

