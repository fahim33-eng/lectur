import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { TimePicker } from '@/components/ui/time-picker';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { notificationService } from '@/services/notifications';
import { storageService } from '@/services/storage';
import { Student } from '@/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function EditStudentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [times, setTimes] = useState<Record<string, string>>({});
  const [classesPerCycle, setClassesPerCycle] = useState<string>('12');
  const [initialClassesCompleted, setInitialClassesCompleted] = useState<string>('0');
  const [tuitionFee, setTuitionFee] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    loadStudent();
  }, [id]);

  const loadStudent = async () => {
    const students = await storageService.getStudents();
    const found = students.find((s) => s.id === id);
    if (found) {
      setStudent(found);
      setName(found.name);
      setSelectedDays(found.weekdays);
      setClassesPerCycle((found.classesPerCycle || 12).toString());
      setInitialClassesCompleted((found.initialClassesCompleted || 0).toString());
      setTuitionFee(found.tuitionFee ? found.tuitionFee.toString() : '');
      // Handle migration from old 'time' to new 'times' format
      if (found.times) {
        setTimes(found.times);
      } else if ((found as any).time) {
        // Migrate old format
        const oldTime = (found as any).time;
        const time24h = convertTo24Hour(oldTime);
        const migratedTimes: Record<string, string> = {};
        found.weekdays.forEach(day => {
          migratedTimes[day] = time24h;
        });
        setTimes(migratedTimes);
      } else {
        // Default
        const defaultTimes: Record<string, string> = {};
        found.weekdays.forEach(day => {
          defaultTimes[day] = '10:00';
        });
        setTimes(defaultTimes);
      }
    }
  };

  const convertTo24Hour = (time12h: string): string => {
    // Convert "10:00 AM" or "2:30 PM" to "10:00" or "14:30"
    const match = time12h.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return '10:00';
    
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
      // Remove time when day is deselected
      const newTimes = { ...times };
      delete newTimes[day];
      setTimes(newTimes);
    } else {
      setSelectedDays([...selectedDays, day]);
      // Set default time if not set
      if (!times[day]) {
        setTimes({ ...times, [day]: '10:00' });
      }
    }
  };

  const handleTimeChange = (day: string, time: string) => {
    setTimes({ ...times, [day]: time });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter student name');
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one weekday');
      return;
    }
    
    // Validate all selected days have times
    const missingTimes = selectedDays.filter(day => !times[day]);
    if (missingTimes.length > 0) {
      Alert.alert('Error', `Please set time for: ${missingTimes.join(', ')}`);
      return;
    }

    const classesPerCycleNum = parseInt(classesPerCycle, 10);
    if (isNaN(classesPerCycleNum) || classesPerCycleNum < 1) {
      Alert.alert('Error', 'Please enter a valid number of classes per cycle (minimum 1)');
      return;
    }

    const initialClassesNum = parseInt(initialClassesCompleted, 10);
    if (isNaN(initialClassesNum) || initialClassesNum < 0) {
      Alert.alert('Error', 'Please enter a valid number of initial classes completed (minimum 0)');
      return;
    }

    if (initialClassesNum > classesPerCycleNum) {
      Alert.alert('Error', 'Initial classes completed cannot exceed classes per cycle');
      return;
    }

    // Validate tuition fee if provided
    let tuitionFeeNum: number | undefined;
    if (tuitionFee.trim()) {
      tuitionFeeNum = parseFloat(tuitionFee);
      if (isNaN(tuitionFeeNum) || tuitionFeeNum < 0) {
        Alert.alert('Error', 'Please enter a valid tuition fee (minimum 0)');
        return;
      }
    }

    setLoading(true);
    try {
      const updatedStudent: Student = {
        ...student!,
        name: name.trim(),
        weekdays: selectedDays,
        times: times,
        classesPerCycle: classesPerCycleNum,
        initialClassesCompleted: initialClassesNum,
        tuitionFee: tuitionFeeNum,
      };
      await storageService.saveStudent(updatedStudent);
      // Reschedule notifications (scheduleNotificationsForStudent already cancels existing ones)
      await notificationService.scheduleNotificationsForStudent(updatedStudent);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update student');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert('Delete Student', 'Are you sure you want to delete this student? All class entries will also be deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // Cancel notifications first
            await notificationService.cancelNotificationsForStudent(id!);
            await storageService.deleteStudent(id!);
            router.replace('/(tabs)');
          } catch {
            Alert.alert('Error', 'Failed to delete student');
          }
        },
      },
    ]);
  };

function DeleteButton({ onPress }: { onPress: () => void }) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <Button
      title="Delete Student"
      onPress={onPress}
      variant="outline"
      style={[styles.button, { borderColor: colors.error }] as any}
      textStyle={{ color: colors.error }}
    />
  );
}

  if (!student) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <ThemedText type="title" style={styles.title}>
            Edit Student
          </ThemedText>

          <Input
            label="Student Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter student name"
          />

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Select Weekdays
          </ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipContainer}>
            {WEEKDAYS.map((day) => (
              <Chip
                key={day}
                selected={selectedDays.includes(day)}
                onPress={() => toggleDay(day)}>
                {day.slice(0, 3)}
              </Chip>
            ))}
          </ScrollView>

          {selectedDays.length > 0 && (
            <>
              <ThemedText type="subtitle" style={styles.sectionTitle}>
                Set Times for Selected Days
              </ThemedText>
              {selectedDays.map((day) => (
                <TimePicker
                  key={day}
                  label={`${day} Time`}
                  value={times[day] || '10:00'}
                  onChange={(time) => handleTimeChange(day, time)}
                />
              ))}
            </>
          )}

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Classes Per Month
          </ThemedText>
          <Input
            label="Number of Classes per Month"
            value={classesPerCycle}
            onChangeText={setClassesPerCycle}
            placeholder="e.g., 12"
            keyboardType="numeric"
          />

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Initial Progress
          </ThemedText>
          <Input
            label="Classes Already Completed"
            value={initialClassesCompleted}
            onChangeText={setInitialClassesCompleted}
            placeholder="e.g., 4"
            keyboardType="numeric"
          />
          <ThemedText style={[styles.hintText, { color: Colors[colorScheme ?? 'light'].textSecondary }]}>
            Number of classes already completed when this student was added.
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Tuition Fee
          </ThemedText>
          <Input
            label="Monthly Tuition Fee (Optional)"
            value={tuitionFee}
            onChangeText={setTuitionFee}
            placeholder="e.g., 5000"
            keyboardType="numeric"
          />
          <ThemedText style={[styles.hintText, { color: Colors[colorScheme ?? 'light'].textSecondary }]}>
            Enter the monthly tuition fee for this student. This will be used for fee tracking.
          </ThemedText>

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={styles.button}
          />

          <DeleteButton onPress={handleDelete} />
        </Card>
      </ScrollView>
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
  },
  card: {
    marginTop: 16,
  },
  title: {
    marginBottom: 28,
    fontWeight: '700',
    fontSize: 28,
  },
  sectionTitle: {
    marginTop: 12,
    marginBottom: 14,
    fontWeight: '700',
    fontSize: 18,
  },
  chipContainer: {
    marginBottom: 20,
    flexDirection: 'row',
  },
  button: {
    marginTop: 20,
  },
  hintText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
});
