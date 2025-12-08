import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { Input } from '@/components/ui/input';
import { TimePicker } from '@/components/ui/time-picker';
import { notificationService } from '@/services/notifications';
import { storageService } from '@/services/storage';
import { Student } from '@/types';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function AddStudentScreen() {
  const [name, setName] = useState('');
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [times, setTimes] = useState<Record<string, string>>({});
  const [classesPerCycle, setClassesPerCycle] = useState<string>('12');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    // Request notification permissions on mount (only if available)
    if (notificationService.isAvailable()) {
      notificationService.requestPermissions();
    }
  }, []);

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

    setLoading(true);
    try {
      const newStudent: Student = {
        id: Date.now().toString(),
        name: name.trim(),
        weekdays: selectedDays,
        times: times,
        classesPerCycle: classesPerCycleNum,
        createdAt: new Date().toISOString(),
      };
      await storageService.saveStudent(newStudent);
      // Schedule notifications
      await notificationService.scheduleNotificationsForStudent(newStudent);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to save student');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[
          styles.content,
          { 
            paddingTop: 40,
            paddingBottom: 40,
          }
        ]}>
        <Card style={styles.card}>
          <ThemedText type="title" style={styles.title}>
            Add New Student
          </ThemedText>

          <Input
            label="Student Name"
            value={name}
            onChangeText={setName}
            placeholder="Enter student name"
            autoFocus
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
            Classes Per Cycle
          </ThemedText>
          <Input
            label="Number of Classes per Cycle/Month"
            value={classesPerCycle}
            onChangeText={setClassesPerCycle}
            placeholder="e.g., 12"
            keyboardType="numeric"
          />

          <Button
            title="Save Student"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={styles.button}
          />
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
    paddingHorizontal: 16,
  },
  card: {
    marginVertical: 0,
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
    marginTop: 28,
  },
});
