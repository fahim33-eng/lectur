import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TimePicker } from '@/components/ui/time-picker';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { storageService } from '@/services/storage';
import { ClassEntry, OneTimeSchedule, Student } from '@/types';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, Keyboard, Modal, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [oneTimeSchedules, setOneTimeSchedules] = useState<OneTimeSchedule[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateSchedules, setSelectedDateSchedules] = useState<{ schedule: OneTimeSchedule; student: Student }[]>([]);
  const [selectedDateWeeklySchedules, setSelectedDateWeeklySchedules] = useState<{ student: Student; entries: ClassEntry[] }[]>([]);
  const [selectedDateEntries, setSelectedDateEntries] = useState<ClassEntry[]>([]);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showAddScheduleModal, setShowAddScheduleModal] = useState(false);
  const [showEditScheduleModal, setShowEditScheduleModal] = useState(false);
  const [showEditWeeklyModal, setShowEditWeeklyModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<OneTimeSchedule | null>(null);
  const [editingWeeklyStudent, setEditingWeeklyStudent] = useState<Student | null>(null);
  const [selectedStudentForSchedule, setSelectedStudentForSchedule] = useState<string>('');
  const [scheduleTime, setScheduleTime] = useState<string>('10:00');
  const [keyboardHeight, setKeyboardHeight] = useState(0);

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

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener('keyboardWillShow', (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardWillHide = Keyboard.addListener('keyboardWillHide', () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStudents();
    const updatedSchedules = await storageService.getOneTimeSchedules();
    setOneTimeSchedules(updatedSchedules);
    if (selectedDate) {
      await handleDateSelect(selectedDate.getDate(), updatedSchedules);
    }
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
    const dateString = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    const weekdayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    
    // Get weekly schedule students
    const weeklyStudents = students.filter(student => 
      student.weekdays.includes(weekdayName)
    );
    
    // Get one-time schedule students for this date (only those with valid times)
    const oneTimeStudentIds = oneTimeSchedules
      .filter(s => s.date === dateString && s.time && s.time.trim() !== '')
      .map(s => s.studentId);
    
    // Get removed weekly schedules (one-time with empty time)
    const removedStudentIds = oneTimeSchedules
      .filter(s => s.date === dateString && (!s.time || s.time.trim() === ''))
      .map(s => s.studentId);
    
    // Combine weekly and one-time, but exclude removed
    const allStudentIds = new Set([
      ...weeklyStudents.filter(s => !removedStudentIds.includes(s.id)).map(s => s.id),
      ...oneTimeStudentIds
    ]);
    
    return students.filter(s => allStudentIds.has(s.id));
  };

  const handleDateSelect = async (day: number | null, schedulesToUse?: OneTimeSchedule[]) => {
    if (day === null) return;
    
    const selected = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    setSelectedDate(selected);
    
    const dateString = selected.toISOString().split('T')[0];
    
    // Load class entries for this date
    const allEntries = await storageService.getClassEntries();
    const dateEntries = allEntries.filter(entry => entry.date === dateString);
    setSelectedDateEntries(dateEntries);
    
    // Get weekly schedule students
    const dayOfWeek = selected.getDay();
    const weekdayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    
    const scheduledStudents = students.filter(student => 
      student.weekdays.includes(weekdayName)
    );
    
    const weeklyScheduleForDate: { student: Student; entries: ClassEntry[] }[] = scheduledStudents.map(student => ({
      student,
      entries: []
    }));
    
    setSelectedDateWeeklySchedules(weeklyScheduleForDate);
    
    // Use provided schedules or current state
    const schedules = schedulesToUse || oneTimeSchedules;
    
    // Get one-time schedules for this date
    const dateSchedules = schedules.filter(s => s.date === dateString);
    const schedulesWithStudents = dateSchedules.map(schedule => {
      const student = students.find(st => st.id === schedule.studentId);
      return { schedule, student: student! };
    }).filter(item => item.student);
    
    setSelectedDateSchedules(schedulesWithStudents);
  };

  const handleAddSchedule = () => {
    if (!selectedDate) {
      Alert.alert('Error', 'Please select a date first');
      return;
    }
    setSelectedStudentForSchedule('');
    setScheduleTime('10:00');
    setShowAddScheduleModal(true);
  };

  const handleSaveSchedule = async () => {
    if (!selectedDate) return;
    
    if (!selectedStudentForSchedule) {
      Alert.alert('Error', 'Please select a student');
      return;
    }
    
    if (!scheduleTime || scheduleTime.trim() === '') {
      Alert.alert('Error', 'Please set a time');
      return;
    }
    
    const dateString = selectedDate.toISOString().split('T')[0];
    
    if (editingSchedule) {
      // Update existing schedule
      const updated: OneTimeSchedule = {
        ...editingSchedule,
        time: scheduleTime,
      };
      await storageService.saveOneTimeSchedule(updated);
      setShowEditScheduleModal(false);
      setEditingSchedule(null);
    } else if (editingWeeklyStudent) {
      // Update weekly schedule for this date (create one-time override)
      const newSchedule: OneTimeSchedule = {
        id: Date.now().toString(),
        studentId: selectedStudentForSchedule,
        date: dateString,
        time: scheduleTime,
        createdAt: new Date().toISOString(),
      };
      // Check if there's already a one-time schedule for this date/student
      const existing = oneTimeSchedules.find(
        s => s.date === dateString && s.studentId === selectedStudentForSchedule
      );
      if (existing) {
        // Update existing
        await storageService.saveOneTimeSchedule({ ...existing, time: scheduleTime });
      } else {
        // Create new
        await storageService.saveOneTimeSchedule(newSchedule);
      }
      setShowEditWeeklyModal(false);
      setEditingWeeklyStudent(null);
    } else {
      // Create new schedule
      const newSchedule: OneTimeSchedule = {
        id: Date.now().toString(),
        studentId: selectedStudentForSchedule,
        date: dateString,
        time: scheduleTime,
        createdAt: new Date().toISOString(),
      };
      await storageService.saveOneTimeSchedule(newSchedule);
      setShowAddScheduleModal(false);
    }
    
    // Get updated schedules directly from storage
    const updatedSchedules = await storageService.getOneTimeSchedules();
    setOneTimeSchedules(updatedSchedules);
    if (selectedDate) {
      await handleDateSelect(selectedDate.getDate(), updatedSchedules);
    }
  };

  const handleEditSchedule = (schedule: OneTimeSchedule) => {
    setEditingSchedule(schedule);
    setSelectedStudentForSchedule(schedule.studentId);
    setScheduleTime(schedule.time);
    setShowEditScheduleModal(true);
  };

  const handleEditWeeklySchedule = (student: Student) => {
    if (!selectedDate) return;
    const dayOfWeek = selectedDate.getDay();
    const weekdayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
    const currentTime = student.times?.[weekdayName] || '10:00';
    
    setEditingWeeklyStudent(student);
    setSelectedStudentForSchedule(student.id);
    setScheduleTime(currentTime);
    setShowEditWeeklyModal(true);
  };

  const handleRemoveWeeklySchedule = async (student: Student) => {
    if (!selectedDate) return;
    
    // Check if there's an entry for this student and date
    const dateString = selectedDate.toISOString().split('T')[0];
    const hasEntry = selectedDateEntries.some(
      entry => entry.studentId === student.id && entry.date === dateString
    );
    
    if (hasEntry) {
      Alert.alert(
        'Cannot Remove',
        'This class has already been completed. You cannot remove a schedule for a class that has an entry.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Remove Schedule',
      `Remove ${student.name}'s class for this date? This will create a one-time override to cancel the weekly schedule.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            // Create a one-time schedule with a special marker or use a different approach
            // For now, we'll create a one-time schedule with time "00:00" to mark it as removed
            const dateString = selectedDate.toISOString().split('T')[0];
            const existingSchedule = oneTimeSchedules.find(
              s => s.date === dateString && s.studentId === student.id
            );
            
            if (existingSchedule) {
              // If exists, delete it (this will restore weekly schedule)
              await storageService.deleteOneTimeSchedule(existingSchedule.id);
            } else {
              // Create a removal marker - we'll use a special time "00:00" to indicate removal
              // Actually, better approach: check if one-time schedule exists, if not create one with "00:00"
              // But for UI, we should just delete any existing one-time and let weekly show
              // Actually, to "remove" weekly, we create a one-time with null/empty time
              // Let's use a different approach: store a "removed" schedule
              const removeSchedule: OneTimeSchedule = {
                id: Date.now().toString(),
                studentId: student.id,
                date: dateString,
                time: '', // Empty time means removed
                createdAt: new Date().toISOString(),
              };
              await storageService.saveOneTimeSchedule(removeSchedule);
            }
            
            // Get updated schedules directly from storage
            const updatedSchedules = await storageService.getOneTimeSchedules();
            setOneTimeSchedules(updatedSchedules);
            if (selectedDate) {
              await handleDateSelect(selectedDate.getDate(), updatedSchedules);
            }
          },
        },
      ]
    );
  };

  const handleDeleteSchedule = (schedule: OneTimeSchedule) => {
    if (!selectedDate) return;
    
    // Check if there's an entry for this student and date
    const dateString = selectedDate.toISOString().split('T')[0];
    const hasEntry = selectedDateEntries.some(
      entry => entry.studentId === schedule.studentId && entry.date === dateString
    );
    
    if (hasEntry) {
      Alert.alert(
        'Cannot Delete',
        'This class has already been completed. You cannot delete a schedule for a class that has an entry.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    Alert.alert(
      'Delete Schedule',
      'Are you sure you want to remove this one-time schedule?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await storageService.deleteOneTimeSchedule(schedule.id);
            // Get updated schedules directly from storage
            const updatedSchedules = await storageService.getOneTimeSchedules();
            setOneTimeSchedules(updatedSchedules);
            if (selectedDate) {
              await handleDateSelect(selectedDate.getDate(), updatedSchedules);
            }
          },
        },
      ]
    );
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
  const horizontalPadding = 8;
  const gap = 6;
  const availableWidth = screenWidth - (horizontalPadding * 2) - (gap * 6);
  const daySize = (availableWidth / 7) * 0.8;
  
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
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]}
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

        <Card style={styles.legendCard}>
          <View style={styles.legendHeader}>
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
            {selectedDate && (
              <TouchableOpacity onPress={handleAddSchedule} style={styles.addButton}>
                <IconSymbol name="plus" size={20} color={colors.tint} />
              </TouchableOpacity>
            )}
          </View>
          {selectedDate ? (
            <>
              {/* One-time schedules */}
              {selectedDateSchedules.length > 0 && (
                <>
                  {selectedDateSchedules
                    .filter(({ schedule }) => schedule.time && schedule.time.trim() !== '') // Only show schedules with valid time
                    .map(({ schedule, student }, index) => {
                      const [hours, minutes] = schedule.time.split(':').map(Number);
                      const timeDate = new Date();
                      timeDate.setHours(hours, minutes);
                      const timeDisplay = timeDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                      
                      // Check if there's an entry for this student and date
                      const dateString = selectedDate!.toISOString().split('T')[0];
                      const hasEntry = selectedDateEntries.some(
                        entry => entry.studentId === student.id && entry.date === dateString
                      );
                      
                      // Check if this is the last item (considering filtered weekly schedules)
                      const visibleWeeklyCount = selectedDateWeeklySchedules.filter(({ student: s }) => {
                        const override = oneTimeSchedules.find(
                          os => os.date === dateString && os.studentId === s.id
                        );
                        return !override || override.time !== '';
                      }).length;
                      const visibleOneTimeCount = selectedDateSchedules.filter(({ schedule: s }) => s.time && s.time.trim() !== '').length;
                      const isLast = index === visibleOneTimeCount - 1 && visibleWeeklyCount === 0;

                      return (
                        <View key={schedule.id} style={[
                          styles.legendItem, 
                          { borderBottomColor: colors.border },
                          isLast && { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }
                        ]}>
                          <View style={[styles.legendDot, { backgroundColor: colors.tint }]} />
                          <View style={styles.legendTextContainer}>
                            <ThemedText style={styles.legendName}>{student.name}</ThemedText>
                            <ThemedText style={[styles.legendSchedule, { color: colors.textSecondary }]}>
                              {timeDisplay} (One-time)
                            </ThemedText>
                          </View>
                          {!hasEntry && (
                            <View style={styles.scheduleActions}>
                              <TouchableOpacity
                                onPress={() => handleEditSchedule(schedule)}
                                style={styles.actionButton}
                              >
                                <IconSymbol name="pencil" size={18} color={colors.tint} />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleDeleteSchedule(schedule)}
                                style={styles.actionButton}
                              >
                                <IconSymbol name="trash" size={18} color={colors.error} />
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      );
                    })}
                </>
              )}
              
              {/* Weekly schedules */}
              {selectedDateWeeklySchedules.length === 0 && selectedDateSchedules.length === 0 ? (
                <ThemedText style={[styles.noClassesText, { color: colors.textSecondary }]}>
                  No classes scheduled for this day
                </ThemedText>
              ) : (
                selectedDateWeeklySchedules.map(({ student }, index) => {
                  // Check if this student has a one-time schedule (override or removal)
                  const dateString = selectedDate!.toISOString().split('T')[0];
                  const oneTimeOverride = oneTimeSchedules.find(
                    s => s.date === dateString && s.studentId === student.id
                  );
                  
                  // If there's a one-time override with empty time, it means removed
                  if (oneTimeOverride && oneTimeOverride.time === '') {
                    return null; // Don't show weekly if it's been removed
                  }
                  
                  // If there's a one-time override with time, don't show weekly (it's already shown above)
                  if (oneTimeOverride && oneTimeOverride.time !== '') {
                    return null;
                  }
                  
                  const dayOfWeek = selectedDate!.getDay();
                  const weekdayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
                  const time = student.times?.[weekdayName];
                  let timeDisplay = '';
                  if (time) {
                    const [hours, minutes] = time.split(':').map(Number);
                    const timeDate = new Date();
                    timeDate.setHours(hours, minutes);
                    timeDisplay = timeDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                  }

                  // Check if there's an entry for this student and date
                  const hasEntry = selectedDateEntries.some(
                    entry => entry.studentId === student.id && entry.date === dateString
                  );

                  const isLast = index === selectedDateWeeklySchedules.length - 1;

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
                            {timeDisplay} (Weekly)
                          </ThemedText>
                        ) : (
                          <ThemedText style={[styles.legendSchedule, { color: colors.textSecondary }]}>
                            Scheduled (Weekly)
                          </ThemedText>
                        )}
                      </View>
                      {!hasEntry && (
                        <View style={styles.scheduleActions}>
                          <TouchableOpacity
                            onPress={() => handleEditWeeklySchedule(student)}
                            style={styles.actionButton}
                          >
                            <IconSymbol name="pencil" size={18} color={colors.tint} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleRemoveWeeklySchedule(student)}
                            style={styles.actionButton}
                          >
                            <IconSymbol name="trash" size={18} color={colors.error} />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                }).filter(Boolean)
              )}
            </>
          ) : (
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

      {/* Add Schedule Modal */}
      <Modal
        visible={showAddScheduleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddScheduleModal(false);
          setSelectedStudentForSchedule('');
          setScheduleTime('10:00');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalCard, 
            { 
              backgroundColor: colors.cardBackground,
              maxHeight: '90%',
              transform: [{ translateY: keyboardHeight > 0 ? Math.max(-keyboardHeight + insets.bottom, -200) : 0 }],
            }
          ]}>
            <View style={styles.modalHeader}>
              <ThemedText type="title" style={styles.modalTitle}>
                Add One-Time Schedule
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowAddScheduleModal(false);
                  setSelectedStudentForSchedule('');
                  setScheduleTime('10:00');
                }}
                style={styles.modalCloseButton}
              >
                <IconSymbol name="xmark" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              keyboardShouldPersistTaps="handled"
            >
              <ThemedText style={[styles.modalDate, { color: colors.textSecondary }]}>
                {selectedDate?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </ThemedText>

              <ThemedText style={[styles.modalLabel, { color: colors.text }]}>
                Select Student
              </ThemedText>
              <ScrollView style={styles.studentList} nestedScrollEnabled>
                {students.map((student) => (
                  <TouchableOpacity
                    key={student.id}
                    onPress={() => setSelectedStudentForSchedule(student.id)}
                    style={[
                      styles.studentOption,
                      { 
                        backgroundColor: selectedStudentForSchedule === student.id 
                          ? colors.tint + '20' 
                          : colors.inputBackground,
                        borderColor: selectedStudentForSchedule === student.id 
                          ? colors.tint 
                          : colors.inputBorder,
                      }
                    ]}
                  >
                    <ThemedText style={[
                      styles.studentOptionText,
                      { 
                        color: selectedStudentForSchedule === student.id 
                          ? colors.tint 
                          : colors.text 
                      }
                    ]}>
                      {student.name}
                    </ThemedText>
                    {selectedStudentForSchedule === student.id && (
                      <IconSymbol name="checkmark" size={20} color={colors.tint} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TimePicker
                label="Time"
                value={scheduleTime}
                onChange={setScheduleTime}
              />

              <Button
                title="Save Schedule"
                onPress={handleSaveSchedule}
                style={styles.modalButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Schedule Modal */}
      <Modal
        visible={showEditScheduleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowEditScheduleModal(false);
          setEditingSchedule(null);
          setSelectedStudentForSchedule('');
          setScheduleTime('10:00');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalCard, 
            { 
              backgroundColor: colors.cardBackground,
              maxHeight: '90%',
              transform: [{ translateY: keyboardHeight > 0 ? Math.max(-keyboardHeight + insets.bottom, -200) : 0 }],
            }
          ]}>
            <View style={styles.modalHeader}>
              <ThemedText type="title" style={styles.modalTitle}>
                Edit Schedule
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowEditScheduleModal(false);
                  setEditingSchedule(null);
                  setSelectedStudentForSchedule('');
                  setScheduleTime('10:00');
                }}
                style={styles.modalCloseButton}
              >
                <IconSymbol name="xmark" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              keyboardShouldPersistTaps="handled"
            >
              <ThemedText style={[styles.modalDate, { color: colors.textSecondary }]}>
                {selectedDate?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </ThemedText>

              <ThemedText style={[styles.modalLabel, { color: colors.text }]}>
                Student: {students.find(s => s.id === selectedStudentForSchedule)?.name}
              </ThemedText>

              <TimePicker
                label="Time"
                value={scheduleTime}
                onChange={setScheduleTime}
              />

              <Button
                title="Update Schedule"
                onPress={handleSaveSchedule}
                style={styles.modalButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Edit Weekly Schedule Modal */}
      <Modal
        visible={showEditWeeklyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowEditWeeklyModal(false);
          setEditingWeeklyStudent(null);
          setSelectedStudentForSchedule('');
          setScheduleTime('10:00');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalCard, 
            { 
              backgroundColor: colors.cardBackground,
              maxHeight: '90%',
              transform: [{ translateY: keyboardHeight > 0 ? Math.max(-keyboardHeight + insets.bottom, -200) : 0 }],
            }
          ]}>
            <View style={styles.modalHeader}>
              <ThemedText type="title" style={styles.modalTitle}>
                Update Schedule
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowEditWeeklyModal(false);
                  setEditingWeeklyStudent(null);
                  setSelectedStudentForSchedule('');
                  setScheduleTime('10:00');
                }}
                style={styles.modalCloseButton}
              >
                <IconSymbol name="xmark" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              keyboardShouldPersistTaps="handled"
            >
              <ThemedText style={[styles.modalDate, { color: colors.textSecondary }]}>
                {selectedDate?.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </ThemedText>

              <ThemedText style={[styles.modalLabel, { color: colors.text }]}>
                Student: {editingWeeklyStudent?.name}
              </ThemedText>
              <ThemedText style={[styles.modalHint, { color: colors.textSecondary }]}>
                This will create a one-time schedule override for this date. The weekly schedule will remain unchanged.
              </ThemedText>

              <TimePicker
                label="Time"
                value={scheduleTime}
                onChange={setScheduleTime}
              />

              <Button
                title="Update Schedule"
                onPress={handleSaveSchedule}
                style={styles.modalButton}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  legendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  legendTitle: {
    fontWeight: '700',
    fontSize: 20,
    flex: 1,
  },
  addButton: {
    padding: 8,
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
  scheduleActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  noClassesText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    minHeight: 500,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
  },
  modalContentContainer: {
    padding: 20,
    paddingBottom: 40,
    minHeight: 400,
  },
  modalDate: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  modalHint: {
    fontSize: 12,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  studentList: {
    maxHeight: 200,
    marginBottom: 16,
  },
  studentOption: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalButton: {
    marginTop: 16,
    marginBottom: 42,
  },
});
