import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { storageService } from '@/services/storage';
import { ClassEntry, Student } from '@/types';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dimensions, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateEntries, setSelectedDateEntries] = useState<{ student: Student; entries: ClassEntry[] }[]>([]);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);

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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const getStudentsForDate = (day: number | null): Student[] => {
    if (day === null) return [];
    
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const dayOfWeek = date.getDay();
    const weekdayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    
    return students.filter(student => 
      student.weekdays.includes(weekdayName)
    );
  };

  const handleDateSelect = async (day: number | null) => {
    if (day === null) return;
    
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(selected);
    
    // Get students scheduled for this weekday (not based on entries)
    const dayOfWeek = selected.getDay();
    const weekdayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    
    // Filter students who have classes on this weekday
    const scheduledStudents = students.filter(student => 
      student.weekdays.includes(weekdayName)
    );
    
    // Format as entriesByStudent structure for consistency with the display
    const scheduleForDate: { student: Student; entries: ClassEntry[] }[] = scheduledStudents.map(student => ({
      student,
      entries: [] // Empty entries array since we're showing schedule, not entries
    }));
    
    setSelectedDateEntries(scheduleForDate);
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const days = useMemo(() => getDaysInMonth(currentDate), [currentDate]);
  const screenWidth = Dimensions.get('window').width;
  const horizontalPadding = 8; // 8px on each side - reduced to fit all 7 days
  const gap = 6; // Consistent gap between all date boxes
  const availableWidth = screenWidth - (horizontalPadding * 2) - (gap * 6); // 6 gaps between 7 date boxes
  const daySize = (availableWidth / 7) * 0.8; // Make boxes 20% smaller
  
  // Organize days into rows (weeks)
  const weeks = useMemo(() => {
    const rows: (number | null)[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(days.slice(i, i + 7));
    }
    return rows;
  }, [days]);

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Card style={styles.headerCard}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
              <ThemedText type="title" style={styles.navArrow}>
                ←
              </ThemedText>
            </TouchableOpacity>
            <ThemedText type="title" style={styles.monthTitle}>
              {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
            </ThemedText>
            <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
              <ThemedText type="title" style={styles.navArrow}>
                →
              </ThemedText>
            </TouchableOpacity>
          </View>

          {/* Weekday headers - aligned with calendar grid */}
          <View style={[styles.weekdayHeader, { paddingHorizontal: horizontalPadding }]}>
            {WEEKDAYS.map((day, index) => (
              <View 
                key={day} 
                style={[styles.weekdayCell, { width: daySize, marginRight: index < 6 ? gap : 0 }]}>
                <ThemedText style={[styles.weekdayText, { color: colors.textSecondary }]}>
                  {day}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={[styles.calendarGrid, { paddingHorizontal: horizontalPadding }]}>
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} style={styles.calendarRow}>
                {week.map((day, dayIndex) => {
                  const dayStudents = getStudentsForDate(day);
                  const isToday = day !== null && 
                    new Date().getDate() === day &&
                    new Date().getMonth() === currentDate.getMonth() &&
                    new Date().getFullYear() === currentDate.getFullYear();

                  const isSelected = day !== null && selectedDate && 
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === currentDate.getMonth() &&
                    selectedDate.getFullYear() === currentDate.getFullYear();

                  return (
                    <TouchableOpacity 
                      key={`${weekIndex}-${dayIndex}`}
                      onPress={() => handleDateSelect(day)}
                      style={[
                        styles.dayCell, 
                        { 
                          width: daySize, 
                          height: daySize,
                          backgroundColor: day ? colors.cardBackground : 'transparent',
                          borderColor: day ? colors.border : 'transparent',
                          marginRight: dayIndex < 6 ? gap : 0,
                          marginBottom: weekIndex < weeks.length - 1 ? gap : 0,
                        },
                        isToday && { borderColor: colors.tint, borderWidth: 2 },
                        isSelected && !isToday && { borderColor: colors.tint, borderWidth: 2, backgroundColor: colors.tint + '15' },
                      ]}>
                      {day !== null && (
                        <View style={styles.dayCellContent}>
                          <ThemedText 
                            style={[
                              styles.dayNumber,
                              (isToday || isSelected) && { color: colors.tint, fontWeight: '700' },
                            ]}>
                            {day}
                          </ThemedText>
                          {dayStudents.length > 0 && (
                            <View style={styles.studentsIndicator}>
                              {dayStudents.slice(0, 3).map((student, idx) => (
                                <View
                                  key={student.id}
                                  style={[
                                    styles.studentDot,
                                    { backgroundColor: colors.tint },
                                    idx > 0 && { marginLeft: 2 },
                                  ]}
                                />
                              ))}
                              {dayStudents.length > 3 && (
                                <ThemedText style={[styles.moreText, { color: colors.textSecondary }]}>
                                  +{dayStudents.length - 3}
                                </ThemedText>
                              )}
                            </View>
                          )}
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>
        </Card>

        {/* Legend / Students Schedule */}
        <Card style={styles.legendCard}>
          <ThemedText type="subtitle" style={styles.legendTitle}>
            {selectedDate 
              ? `Classes on ${selectedDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}`
              : 'Students Schedule'}
          </ThemedText>
          {selectedDate ? (
            // Show schedule for selected date (based on weekdays, not entries)
            selectedDateEntries.length === 0 ? (
              <ThemedText style={[styles.noClassesText, { color: colors.textSecondary }]}>
                No classes scheduled for this day
              </ThemedText>
            ) : (
              selectedDateEntries.map(({ student }, index) => {
                const dayOfWeek = selectedDate.getDay();
                const weekdayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
                const time = student.times?.[weekdayName];
                let timeDisplay = '';
                if (time) {
                  const [hours, minutes] = time.split(':').map(Number);
                  const timeDate = new Date();
                  timeDate.setHours(hours, minutes);
                  timeDisplay = timeDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                }

                const isLast = index === selectedDateEntries.length - 1;

                return (
                  <View key={student.id} style={[
                    styles.legendItem, 
                    { borderBottomColor: colors.border },
                    isLast && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }
                  ]}>
                    <View style={[styles.legendDot, { backgroundColor: colors.tint }]} />
                    <View style={styles.legendTextContainer}>
                      <ThemedText style={styles.legendName}>{student.name}</ThemedText>
                      {timeDisplay ? (
                        <ThemedText style={[styles.legendSchedule, { color: colors.textSecondary }]}>
                          {timeDisplay}
                        </ThemedText>
                      ) : (
                        <ThemedText style={[styles.legendSchedule, { color: colors.textSecondary }]}>
                          Scheduled
                        </ThemedText>
                      )}
                    </View>
                  </View>
                );
              })
            )
          ) : (
            // Show regular schedule
            students.map((student) => {
              const schedule = student.weekdays.map(day => {
                const time = student.times?.[day];
                if (!time) return null;
                const [hours, minutes] = time.split(':').map(Number);
                const date = new Date();
                date.setHours(hours, minutes);
                return `${day.slice(0, 3)} ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
              }).filter(Boolean).join(', ');

              return (
                <View key={student.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: colors.tint }]} />
                  <View style={styles.legendTextContainer}>
                    <ThemedText style={styles.legendName}>{student.name}</ThemedText>
                    <ThemedText style={[styles.legendSchedule, { color: colors.textSecondary }]}>
                      {schedule || 'No schedule set'}
                    </ThemedText>
                  </View>
                </View>
              );
            })
          )}
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
    gap: 16,
  },
  headerCard: {
    marginBottom: 8,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  navButton: {
    padding: 8,
    minWidth: 44,
    alignItems: 'center',
  },
  navArrow: {
    fontSize: 24,
    fontWeight: '700',
  },
  weekdayHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  calendarGrid: {
    // paddingHorizontal is set dynamically
  },
  calendarRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  dayCell: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellContent: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  studentsIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 2,
  },
  studentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  moreText: {
    fontSize: 8,
    marginLeft: 2,
  },
  legendCard: {
    marginTop: 8,
  },
  legendTitle: {
    fontWeight: '700',
    marginBottom: 16,
    fontSize: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  legendSchedule: {
    fontSize: 14,
  },
  noClassesText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 15,
  },
});

