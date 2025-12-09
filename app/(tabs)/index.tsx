import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { FAB } from '@/components/ui/fab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { storageService } from '@/services/storage';
import { OneTimeSchedule, Student } from '@/types';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, Image, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TodayDateHeader() {
  const today = new Date();
  const weekday = today.toLocaleDateString('en-US', { weekday: 'long' });
  const day = today.getDate();
  const month = today.toLocaleDateString('en-US', { month: 'long' });
  
  const getOrdinalSuffix = (num: number): string => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return num + 'st';
    if (j === 2 && k !== 12) return num + 'nd';
    if (j === 3 && k !== 13) return num + 'rd';
    return num + 'th';
  };

  return (
    <Card style={styles.dateCard}>
      <ThemedText type="title" style={styles.dateText}>
        {weekday}, {getOrdinalSuffix(day)} {month}
      </ThemedText>
    </Card>
  );
}

function TodayStudentCard({ student, time, isOneTime, onPress, onEditSchedule }: { student: Student; time: string; isOneTime: boolean; onPress: () => void; onEditSchedule: () => void }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const updateTimeRemaining = async () => {
      if (!time) {
        setTimeRemaining('');
        return;
      }

      // Check if entry exists for today
      const todayDateString = new Date().toISOString().split('T')[0];
      const entries = await storageService.getClassEntries(student.id);
      const todayEntry = entries.find(entry => entry.date === todayDateString);

      const [hours, minutes] = time.split(':').map(Number);
      const classTime = new Date();
      classTime.setHours(hours, minutes, 0, 0);

      const now = new Date();
      let diff = classTime.getTime() - now.getTime();

      if (diff < 0) {
        // Class time has passed
        if (todayEntry) {
          setTimeRemaining('Class Finished');
        } else {
          setTimeRemaining('Class time started');
        }
        return;
      }

      const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
      const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hoursRemaining > 0) {
        setTimeRemaining(`${hoursRemaining}h ${minutesRemaining}m remaining`);
      } else {
        setTimeRemaining(`${minutesRemaining}m remaining`);
      }
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [student, time]);

  // Refresh status when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const updateTimeRemaining = async () => {
        if (!time) {
          setTimeRemaining('');
          return;
        }

        // Check if entry exists for today
        const todayDateString = new Date().toISOString().split('T')[0];
        const entries = await storageService.getClassEntries(student.id);
        const todayEntry = entries.find(entry => entry.date === todayDateString);

        const [hours, minutes] = time.split(':').map(Number);
        const classTime = new Date();
        classTime.setHours(hours, minutes, 0, 0);

        const now = new Date();
        let diff = classTime.getTime() - now.getTime();

        if (diff < 0) {
          // Class time has passed
          if (todayEntry) {
            setTimeRemaining('Class Finished');
          } else {
            setTimeRemaining('Class time started');
          }
          return;
        }

        const hoursRemaining = Math.floor(diff / (1000 * 60 * 60));
        const minutesRemaining = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hoursRemaining > 0) {
          setTimeRemaining(`${hoursRemaining}h ${minutesRemaining}m remaining`);
        } else {
          setTimeRemaining(`${minutesRemaining}m remaining`);
        }
      };
      updateTimeRemaining();
    }, [student, time])
  );

  const getTodayTime = (): string => {
    if (!time) return '';
    
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <Card onPress={onPress} elevated style={styles.todayCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.avatar, { backgroundColor: colors.tint + '20' }]}>
          <ThemedText style={[styles.avatarText, { color: colors.tint }]}>
            {student.name.charAt(0).toUpperCase()}
          </ThemedText>
        </View>
        <View style={styles.cardHeaderContent}>
          <ThemedText type="subtitle" style={styles.studentName}>
            {student.name}
          </ThemedText>
          <View style={styles.timeRow}>
            <IconSymbol name="clock.fill" size={14} color={colors.textSecondary} />
            <ThemedText style={[styles.classTime, { color: colors.textSecondary }]}>
              {getTodayTime()}
            </ThemedText>
          </View>
          {timeRemaining && (
            <View style={styles.timeRemainingRow}>
              <ThemedText style={[styles.timeRemaining, { color: colors.tint }]}>
                {timeRemaining}
              </ThemedText>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onEditSchedule();
          }}
          style={styles.editButton}>
          <IconSymbol name="pencil" size={20} color={colors.tint} />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

interface TodayStudent {
  student: Student;
  time: string; // 24h format
  isOneTime: boolean; // true if from one-time schedule, false if from weekly schedule
}

export default function OverviewScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [oneTimeSchedules, setOneTimeSchedules] = useState<OneTimeSchedule[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;

  const loadStudents = async () => {
    const data = await storageService.getStudents();
    setStudents(data);
  };

  const loadOneTimeSchedules = async () => {
    const schedules = await storageService.getOneTimeSchedules();
    setOneTimeSchedules(schedules);
  };

  useEffect(() => {
    loadStudents();
    loadOneTimeSchedules();
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStudents();
      loadOneTimeSchedules();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    await loadOneTimeSchedules();
    setRefreshing(false);
  };

  const todayStudents = useMemo((): TodayStudent[] => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const dayOfWeek = today.getDay();
    const weekdayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    
    const result: TodayStudent[] = [];
    const addedStudentIds = new Set<string>();
    
    // Add weekly schedule students
    students.forEach(student => {
      if (student.weekdays.includes(weekdayName) && student.times?.[weekdayName]) {
        result.push({
          student,
          time: student.times[weekdayName],
          isOneTime: false,
        });
        addedStudentIds.add(student.id);
      }
    });
    
    // Handle one-time schedules
    oneTimeSchedules.forEach(schedule => {
      if (schedule.date === todayString) {
        const student = students.find(s => s.id === schedule.studentId);
        if (student) {
          // If one-time schedule has empty time, it means weekly was removed - skip it
          if (!schedule.time || schedule.time.trim() === '') {
            // Remove from result if it was added from weekly schedule
            const index = result.findIndex(item => item.student.id === schedule.studentId);
            if (index >= 0) {
              result.splice(index, 1);
              addedStudentIds.delete(schedule.studentId);
            }
            return;
          }
          
          // If one-time schedule has valid time
          const index = result.findIndex(item => item.student.id === schedule.studentId && !item.isOneTime);
          if (index >= 0) {
            // Replace weekly schedule with one-time schedule
            result[index] = {
              student,
              time: schedule.time,
              isOneTime: true,
            };
          } else if (!addedStudentIds.has(schedule.studentId)) {
            // Add new one-time schedule
            result.push({
              student,
              time: schedule.time,
              isOneTime: true,
            });
            addedStudentIds.add(schedule.studentId);
          }
        }
      }
    });
    
    return result;
  }, [students, oneTimeSchedules]);
  const tabBarHeight = 60 + insets.bottom; // Match tab bar height from _layout.tsx
  const fabBottomPosition = tabBarHeight + 16; // 16px above tab bar for consistent positioning

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, minHeight: screenHeight }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content, 
          { 
            paddingBottom: tabBarHeight + 100,
            minHeight: screenHeight - insets.top - tabBarHeight
          }
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <TodayDateHeader />
        
        <View style={styles.sectionHeader}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Today&apos;s Classes
          </ThemedText>
          {todayStudents.length === 0 && (
            <View style={styles.noClassesCard}>
              <View style={styles.imageWrapper}>
                <Image 
                  source={require('@/assets/images/no_class.jpg')} 
                  style={styles.noClassImage}
                  resizeMode="cover"
                />
              </View>
              <ThemedText style={[styles.noClassesText, { color: Colors[colorScheme ?? 'light'].textSecondary }]}>
                No classes scheduled for today
              </ThemedText>
            </View>
          )}
        </View>

        {todayStudents.map((item) => (
          <TodayStudentCard
            key={item.student.id}
            student={item.student}
            time={item.time}
            isOneTime={item.isOneTime}
            onPress={() => router.push(`/student/${item.student.id}`)}
            onEditSchedule={() => router.push(`/edit-student/${item.student.id}`)}
          />
        ))}
      </ScrollView>
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: fabBottomPosition }] as any}
        onPress={() => router.push('/add-student')}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 20,
  },
  dateCard: {
    marginBottom: 16,
    padding: 20,
  },
  dateText: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 4,
  },
  noClassesCard: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 30,
  },
  imageWrapper: {
    width: 280,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  noClassImage: {
    width: '100%',
    height: '100%',
  },
  noClassesText: {
    fontSize: 16,
    textAlign: 'center',
  },
  todayCard: {
    marginBottom: 12,
    padding: 18,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
  },
  cardHeaderContent: {
    flex: 1,
  },
  studentName: {
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 18,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  classTime: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  timeRemainingRow: {
    marginTop: 4,
  },
  timeRemaining: {
    fontSize: 13,
    fontWeight: '600',
  },
  editButton: {
    padding: 8,
  },
  fab: {
    position: 'absolute',
    marginRight: 16,
    right: 0
  },
});
