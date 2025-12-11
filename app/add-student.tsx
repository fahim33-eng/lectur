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
  const [initialClassesCompleted, setInitialClassesCompleted] = useState<string>('0');
  const [tuitionFee, setTuitionFee] = useState<string>('');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [mobileError, setMobileError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

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

  const validateBangladeshiMobile = (number: string): boolean => {
    if (!number.trim()) return true; // Optional field
    
    // Remove spaces and dashes, but keep plus for checking
    let cleaned = number.replace(/[\s\-]/g, '');
    
    // Check if starts with +8801 or 01
    if (cleaned.startsWith('+8801')) {
      // Remove +8801 prefix and check if remaining has more than 8 characters
      const remaining = cleaned.substring(5); // +8801 is 5 chars
      return remaining.length > 8 && /^\d+$/.test(remaining);
    } else if (cleaned.startsWith('8801')) {
      // Remove 8801 prefix and check if remaining has more than 8 characters
      const remaining = cleaned.substring(4); // 8801 is 4 chars
      return remaining.length > 8 && /^\d+$/.test(remaining);
    } else if (cleaned.startsWith('01')) {
      // Remove 01 prefix and check if remaining has more than 8 characters
      const remaining = cleaned.substring(2); // 01 is 2 chars
      return remaining.length > 8 && /^\d+$/.test(remaining);
    }
    
    // If doesn't match expected prefixes, reject
    return false;
  };

  const handleMobileNumberChange = (text: string) => {
    setMobileNumber(text);
    if (text.trim() && !validateBangladeshiMobile(text)) {
      setMobileError('Please enter a valid Bangladeshi mobile number (e.g., 01XXXXXXXXX)');
    } else {
      setMobileError('');
    }
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

    // Validate mobile number if provided
    let mobileNumberValue: string | undefined;
    if (mobileNumber.trim()) {
      if (!validateBangladeshiMobile(mobileNumber)) {
        Alert.alert('Error', 'Please enter a valid Bangladeshi mobile number (e.g., 01XXXXXXXXX)');
        return;
      }
      // Just clean the number (remove spaces, dashes, plus) but don't manipulate it
      mobileNumberValue = mobileNumber.replace(/[\s\-+]/g, '');
    }

    setLoading(true);
    try {
      const newStudent: Student = {
        id: Date.now().toString(),
        name: name.trim(),
        weekdays: selectedDays,
        times: times,
        classesPerCycle: classesPerCycleNum,
        initialClassesCompleted: initialClassesNum,
        tuitionFee: tuitionFeeNum,
        mobileNumber: mobileNumberValue,
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
            label="Classes Already Completed (Optional)"
            value={initialClassesCompleted}
            onChangeText={setInitialClassesCompleted}
            placeholder="e.g., 4"
            keyboardType="numeric"
          />
          <ThemedText style={[styles.hintText, { color: colors.textSecondary }]}>
            If you&apos;ve already taken some classes before adding this student, enter the number here.
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>
          </ThemedText>
          <Input
            label="Mobile Number (Optional)"
            value={mobileNumber}
            onChangeText={handleMobileNumberChange}
            placeholder="e.g., 01712345678"
            keyboardType="phone-pad"
          />
          {mobileError ? (
            <ThemedText style={[styles.errorText, { color: colors.error }]}>
              {mobileError}
            </ThemedText>
          ) : (
            <ThemedText style={[styles.hintText, { color: colors.textSecondary }]}>
              (e.g., 01712345678 or 8801712345678)
            </ThemedText>
          )}

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
          <ThemedText style={[styles.hintText, { color: colors.textSecondary }]}>
            Enter the monthly tuition fee for this student. This will be used for fee tracking.
          </ThemedText>

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
  hintText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    fontWeight: '600',
  },
});
