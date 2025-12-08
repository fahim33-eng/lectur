import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { FAB } from '@/components/ui/fab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { storageService } from '@/services/storage';
import { Student } from '@/types';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, Image, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function EmptyState() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <View style={styles.emptyCard}>
      <View style={styles.imageWrapper}>
        <Image 
          source={require('@/assets/images/no_student_found.jpg')} 
          style={styles.emptyImage}
          resizeMode="cover"
        />
      </View>
      <ThemedText type="title" style={styles.emptyText}>
        No Students Yet
      </ThemedText>
      <ThemedText style={[styles.emptySubtext, { color: colors.textSecondary }]}>
        Tap the + button to add your first student
      </ThemedText>
    </View>
  );
}

export default function StudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const screenHeight = Dimensions.get('window').height;

  const loadStudents = async () => {
    const data = await storageService.getStudents();
    setStudents(data);
  };

  useEffect(() => {
    loadStudents();
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    setRefreshing(false);
  };

  const tabBarHeight = 20 + insets.bottom;
  const fabBottomPosition = tabBarHeight; // Positioned at the bottom navigation bar level

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
        {students.length === 0 ? (
          <EmptyState />
        ) : (
          students.map((student) => (
            <StudentCard
              key={student.id}
              student={student}
              onPress={() => router.push(`/student/${student.id}`)}
              onEditSchedule={() => router.push(`/edit-student/${student.id}`)}
            />
          ))
        )}
      </ScrollView>
      <FAB
        icon="plus"
        style={[styles.fab, { bottom: fabBottomPosition }] as any}
        onPress={() => router.push('/add-student')}
      />
    </ThemedView>
  );
}

function StudentCard({ student, onPress, onEditSchedule }: { student: Student; onPress: () => void; onEditSchedule: () => void }) {
  const [classCount, setClassCount] = useState(0);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const loadCount = useCallback(async () => {
    const entries = await storageService.getClassEntries(student.id);
    setClassCount(entries.length);
  }, [student.id]);

  useEffect(() => {
    loadCount();
  }, [loadCount]);

  // Reload count when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadCount();
    }, [loadCount])
  );

  const classesPerCycle = student.classesPerCycle || 12;
  const progress = Math.min(classCount / classesPerCycle, 1);
  const isComplete = classCount >= classesPerCycle;

  const formatTimes = (): string => {
    if (student.times) {
      const timeStrings = student.weekdays.map(day => {
        const time = student.times[day];
        if (!time) return '';
        const [hours, minutes] = time.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes);
        return `${day.slice(0, 3)} ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
      }).filter(Boolean);
      return timeStrings.join(' • ');
    }
    // Fallback for old format
    if ((student as any).time) {
      return `${student.weekdays.join(', ')} • ${(student as any).time}`;
    }
    return student.weekdays.join(', ');
  };

  return (
    <Card onPress={onPress} elevated style={styles.card}>
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
          <ThemedText style={[styles.studentInfo, { color: colors.textSecondary }]}>
            {formatTimes()}
          </ThemedText>
        </View>
        <TouchableOpacity
          onPress={(e) => {
            e.stopPropagation();
            onEditSchedule();
          }}
          style={styles.editButton}>
          <IconSymbol name="pencil" size={20} color={colors.tint} />
        </TouchableOpacity>
        {isComplete && (
          <View style={[styles.badge, { backgroundColor: colors.success }]}>
            <ThemedText style={styles.badgeText}>Fee Due</ThemedText>
          </View>
        )}
      </View>
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <ThemedText style={[styles.progressLabel, { color: colors.textSecondary }]}>
            Progress
          </ThemedText>
          <ThemedText style={[styles.progressValue, { color: colors.text }]}>
            {classCount} / {classesPerCycle}
          </ThemedText>
        </View>
        <ProgressBar 
          progress={progress} 
          color={isComplete ? colors.progressComplete : colors.progressDefault} 
          style={styles.progressBar} 
        />
      </View>
    </Card>
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
    gap: 12,
    paddingBottom: 20,
  },
  card: {
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  cardHeaderContent: {
    flex: 1,
  },
  studentName: {
    fontWeight: '700',
    marginBottom: 4,
    fontSize: 20,
  },
  studentInfo: {
    fontSize: 14,
  },
  editButton: {
    padding: 8,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressSection: {
    marginTop: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  progressValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  emptyCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    minHeight: 500,
  },
  imageWrapper: {
    width: 280,
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    backgroundColor: 'transparent',
  },
  emptyImage: {
    width: '100%',
    height: '100%',
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtext: {
    textAlign: 'center',
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    marginRight: 16,
    right: 0,
  },
});

