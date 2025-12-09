import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import { FAB } from '@/components/ui/fab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { storageService } from '@/services/storage';
import { ClassEntry, Student, FeeEntry } from '@/types';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Keyboard, Modal, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function EmptyEntriesState() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
      No class entries yet. Tap the + button to add your first class.
    </ThemedText>
  );
}

const StudentHeaderContent = ({ 
  student, 
  id, 
  router, 
  progress, 
  isComplete, 
  totalClasses, 
  remaining,
  classesPerCycle,
  initialClasses
}: { 
  student: Student; 
  id: string | string[] | undefined; 
  router: any; 
  progress: number; 
  isComplete: boolean; 
  totalClasses: number; 
  remaining: number;
  classesPerCycle: number;
  initialClasses: number;
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const studentId = Array.isArray(id) ? id[0] : id;

  return (
    <>
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => router.push(`/edit-student/${studentId}`)}>
        <IconSymbol name="pencil" size={22} color={colors.tint} />
      </TouchableOpacity>
      <ThemedText type="title" style={styles.studentName}>
        {student.name}
      </ThemedText>
      <ThemedText type="subtitle" style={[styles.studentInfo, { color: colors.textSecondary }]}>
        {student.weekdays.join(', ')}
      </ThemedText>
      {student.times && (
        <View style={styles.timesContainer}>
          {student.weekdays.map((day) => {
            const time = student.times[day];
            if (!time) return null;
            const [hours, minutes] = time.split(':').map(Number);
            const date = new Date();
            date.setHours(hours, minutes);
            return (
              <ThemedText key={day} style={[styles.studentInfo, { color: colors.textSecondary }]}>
                {day}: {date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </ThemedText>
            );
          })}
        </View>
      )}
      {!student.times && (student as any).time && (
        <ThemedText style={[styles.studentInfo, { color: colors.textSecondary }]}>
          {(student as any).time}
        </ThemedText>
      )}

      <ProgressBar
        progress={progress}
        color={isComplete ? colors.progressComplete : colors.progressDefault}
        style={styles.progressBar}
      />
      <ThemedText type="subtitle" style={styles.progressText}>
        {totalClasses} / {classesPerCycle} classes
        {initialClasses > 0 && (
          <ThemedText style={[styles.initialClassesText, { color: colors.textSecondary }]}>
            {' '}({initialClasses} initial)
          </ThemedText>
        )}
      </ThemedText>
      {!isComplete && (
        <ThemedText style={[styles.remainingText, { color: colors.textSecondary }]}>
          {remaining} classes remaining
        </ThemedText>
      )}
    </>
  );
};

export default function StudentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [classEntries, setClassEntries] = useState<ClassEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddEntryModal, setShowAddEntryModal] = useState(false);
  const [entryTopics, setEntryTopics] = useState('');
  const [entryRemarks, setEntryRemarks] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const loadData = useCallback(async () => {
    const students = await storageService.getStudents();
    const found = students.find((s) => s.id === id);
    if (found) {
      setStudent(found);
    }
    const entries = await storageService.getClassEntries(id);
    // Sort by date, newest first
    entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setClassEntries(entries);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Handle keyboard visibility
  useEffect(() => {
    if (showAddEntryModal) {
      const showSubscription = Keyboard.addListener('keyboardDidShow', (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      });
      const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
        setKeyboardHeight(0);
      });

      return () => {
        showSubscription.remove();
        hideSubscription.remove();
      };
    } else {
      setKeyboardHeight(0);
    }
  }, [showAddEntryModal]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddClass = () => {
    // Check if cycle is complete
    if (student) {
      const classCount = classEntries.length;
      const classesPerCycle = student.classesPerCycle || 12;
      const initialClasses = student.initialClassesCompleted || 0;
      const totalClasses = classCount + initialClasses;
      
      if (totalClasses >= classesPerCycle) {
        Alert.alert(
          'Cycle Complete',
          'This cycle is already complete. Please reset the cycle to start a new one.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Reset Cycle',
              onPress: handleResetEntries,
            },
          ]
        );
        return;
      }
    }
    
    // Open modal to add entry with notes
    setEntryTopics('');
    setEntryRemarks('');
    setShowAddEntryModal(true);
  };

  const handleSaveEntry = async () => {
    if (!student) return;
    
    const today = new Date().toISOString().split('T')[0];
    const classCount = classEntries.length;
    const classesPerCycle = student.classesPerCycle || 12;
    const initialClasses = student.initialClassesCompleted || 0;
    const totalClasses = classCount + initialClasses;

    // Check if cycle is complete before adding
    if (totalClasses >= classesPerCycle) {
      Alert.alert(
        'Cycle Complete',
        'This cycle is already complete. Please reset the cycle to start a new one.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Reset Cycle',
            onPress: handleResetEntries,
          },
        ]
      );
      setShowAddEntryModal(false);
      return;
    }

    try {
      const newEntry: ClassEntry = {
        id: Date.now().toString(),
        studentId: id!,
        date: today,
        createdAt: new Date().toISOString(),
        topics: entryTopics.trim() || undefined,
        remarks: entryRemarks.trim() || undefined,
      };
      await storageService.saveClassEntry(newEntry);
      
      // Check if cycle is now complete after adding this entry
      const newTotalClasses = totalClasses + 1;
      if (newTotalClasses >= classesPerCycle && student.tuitionFee) {
        // Check if fee entry already exists for this month/cycle
        const now = new Date();
        const month = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const existingFees = await storageService.getFeeEntries(student.id);
        const existingFeeForMonth = existingFees.find(
          fee => fee.month === month && fee.studentId === student.id
        );
        
        // Only create fee entry if it doesn't already exist
        if (!existingFeeForMonth) {
          const feeEntry: FeeEntry = {
            id: Date.now().toString() + '_fee',
            studentId: student.id,
            studentName: student.name,
            amount: student.tuitionFee,
            month: month,
            date: today,
            status: 'Payment Due',
            createdAt: new Date().toISOString(),
          };
          await storageService.saveFeeEntry(feeEntry);
        }
      }
      
      await loadData();
      setShowAddEntryModal(false);
      setEntryTopics('');
      setEntryRemarks('');
      Alert.alert('Success', 'Class entry added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add class entry');
      console.error(error);
    }
  };


  const handleResetEntries = () => {
    Alert.alert('Reset Entries', 'Are you sure you want to reset all class entries? This will clear the progress and start from 0.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          try {
            // Delete all entries for this student
            const entries = await storageService.getClassEntries(id);
            for (const entry of entries) {
              await storageService.deleteClassEntry(entry.id);
            }
            await loadData();
            Alert.alert('Success', 'Class entries have been reset');
          } catch (error) {
            Alert.alert('Error', 'Failed to reset entries');
            console.error(error);
          }
        },
      },
    ]);
  };

  if (!student) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>Loading...</ThemedText>
      </ThemedView>
    );
  }

  const classCount = classEntries.length;
  const classesPerCycle = student.classesPerCycle || 12;
  const initialClasses = student.initialClassesCompleted || 0;
  const totalClasses = classCount + initialClasses;
  const progress = Math.min(totalClasses / classesPerCycle, 1);
  const isComplete = totalClasses >= classesPerCycle;
  const remaining = Math.max(0, classesPerCycle - totalClasses);


  // Sort entries by date (newest first), then by creation time
  const sortedEntries = [...classEntries].sort((a, b) => {
    const dateCompare = new Date(b.date).getTime() - new Date(a.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Assign entry numbers (1, 2, 3, etc.) - can be edited
  const entriesWithNumbers = sortedEntries.map((entry, index) => ({
    ...entry,
    entryNumber: index + 1,
  }));

  const formatDateTime = (dateString: string, createdAt: string) => {
    const date = new Date(dateString);
    const created = new Date(createdAt);
    const dateStr = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const timeStr = created.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return { dateStr, timeStr };
  };

  const handleDeleteEntry = async (entry: ClassEntry) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await storageService.deleteClassEntry(entry.id);
            await loadData();
          },
        },
      ]
    );
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <Card style={styles.headerCard}>
          <StudentHeaderContent 
            student={student}
            id={id!}
            router={router}
            progress={progress}
            isComplete={isComplete}
            totalClasses={totalClasses}
            remaining={remaining}
            classesPerCycle={classesPerCycle}
            initialClasses={initialClasses}
          />
        </Card>

        <Card style={styles.entriesCard}>
          <View style={styles.entriesHeader}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Class Entries
            </ThemedText>
            {classCount > 0 && (
              <TouchableOpacity
                onPress={handleResetEntries}
                style={[styles.resetButton, { borderColor: Colors[colorScheme ?? 'light'].tint }]}>
                <ThemedText style={[styles.resetButtonText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                  Reset
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
          {classEntries.length === 0 ? (
            <EmptyEntriesState />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.tableScrollView}>
              <View style={styles.tableContainer}>
                {/* Table Header */}
                <View style={[styles.tableRow, styles.tableHeader, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}>
                  <View style={[styles.tableCellHeader, styles.colEntryNumber]}>
                    <ThemedText style={[styles.tableHeaderText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                      #
                    </ThemedText>
                  </View>
                  <View style={[styles.tableCellHeader, styles.colDateTime]}>
                    <ThemedText style={[styles.tableHeaderText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                      Date & Time
                    </ThemedText>
                  </View>
                  <View style={[styles.tableCellHeader, styles.colTopics]}>
                    <ThemedText style={[styles.tableHeaderText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                      Topics
                    </ThemedText>
                  </View>
                  <View style={[styles.tableCellHeader, styles.colRemarks]}>
                    <ThemedText style={[styles.tableHeaderText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                      Remarks
                    </ThemedText>
                  </View>
                  <View style={[styles.tableCellHeader, styles.colDelete]}>
                    <ThemedText style={[styles.tableHeaderText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                      Delete
                    </ThemedText>
                  </View>
                </View>

                {/* Table Rows */}
                {entriesWithNumbers.map((entry) => {
                  const { dateStr, timeStr } = formatDateTime(entry.date, entry.createdAt);

                  return (
                    <View 
                      key={entry.id} 
                      style={[
                        styles.tableRow, 
                        { borderBottomColor: Colors[colorScheme ?? 'light'].border }
                      ]}
                    >
                      {/* Entry Number */}
                      <View style={[styles.tableCell, styles.colEntryNumber]}>
                        <ThemedText style={[styles.tableCellText, { color: Colors[colorScheme ?? 'light'].tint, fontWeight: '600' }]}>
                          {entry.entryNumber}
                        </ThemedText>
                      </View>

                      {/* Date & Time */}
                      <View style={[styles.tableCell, styles.colDateTime]}>
                        <ThemedText 
                          style={styles.tableCellText}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {dateStr}
                        </ThemedText>
                        <ThemedText 
                          style={[styles.tableCellTextSmall, { color: Colors[colorScheme ?? 'light'].textSecondary }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {timeStr}
                        </ThemedText>
                      </View>

                      {/* Topics */}
                      <View style={[styles.tableCell, styles.colTopics]}>
                        <ThemedText 
                          style={[styles.tableCellText, { 
                            color: entry.topics ? Colors[colorScheme ?? 'light'].text : Colors[colorScheme ?? 'light'].textSecondary 
                          }]}
                          numberOfLines={4}
                          ellipsizeMode="tail"
                        >
                          {entry.topics || '-'}
                        </ThemedText>
                      </View>

                      {/* Remarks */}
                      <View style={[styles.tableCell, styles.colRemarks]}>
                        <ThemedText 
                          style={[styles.tableCellText, { 
                            color: entry.remarks ? Colors[colorScheme ?? 'light'].text : Colors[colorScheme ?? 'light'].textSecondary 
                          }]}
                          numberOfLines={4}
                          ellipsizeMode="tail"
                        >
                          {entry.remarks || '-'}
                        </ThemedText>
                      </View>

                      {/* Delete Action */}
                      <View style={[styles.tableCell, styles.colDelete]}>
                        <TouchableOpacity
                          onPress={() => handleDeleteEntry(entry)}
                          style={[styles.actionButton, { backgroundColor: Colors[colorScheme ?? 'light'].error + '20' }]}
                        >
                          <IconSymbol name="trash" size={16} color={Colors[colorScheme ?? 'light'].error} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          )}
        </Card>
      </ScrollView>
      <FAB 
        icon="plus" 
        style={[styles.fab, { bottom: 60 + insets.bottom + 16 }] as any} 
        onPress={handleAddClass} 
      />

      {/* Add Entry Modal */}
      <Modal
        visible={showAddEntryModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setShowAddEntryModal(false);
          setEntryTopics('');
          setEntryRemarks('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalCard, 
            { 
              backgroundColor: Colors[colorScheme ?? 'light'].cardBackground,
              transform: [{ translateY: keyboardHeight > 0 ? -keyboardHeight + insets.bottom : 0 }],
            }
          ]}>
            <View style={styles.modalHeader}>
              <ThemedText type="title" style={styles.modalTitle}>
                Add Class Entry
              </ThemedText>
              <TouchableOpacity
                onPress={() => {
                  setShowAddEntryModal(false);
                  setEntryTopics('');
                  setEntryRemarks('');
                }}
                style={styles.modalCloseButton}
              >
                <IconSymbol name="xmark" size={24} color={Colors[colorScheme ?? 'light'].text} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentContainer}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
            >
              <ThemedText style={[styles.modalDate, { color: Colors[colorScheme ?? 'light'].textSecondary }]}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </ThemedText>

              <Input
                label="Topics Covered (Optional)"
                value={entryTopics}
                onChangeText={setEntryTopics}
                placeholder="e.g., Algebra, Geometry, Trigonometry"
                multiline={false}
                style={styles.modalInput}
              />

              <Input
                label="Remarks / Homework (Optional)"
                value={entryRemarks}
                onChangeText={setEntryRemarks}
                placeholder="e.g., Homework: Page 45-50, Practice problems 1-10"
                multiline={true}
                numberOfLines={4}
                style={[styles.modalInput, styles.textArea]}
              />

              <Button
                title="Save Entry"
                onPress={handleSaveEntry}
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
    paddingTop: 20,
    paddingBottom: 20,
    gap: 16,
  },
  headerCard: {
    marginBottom: 8,
    position: 'relative',
  },
  editButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    zIndex: 1,
    padding: 8,
  },
  studentName: {
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 10,
    fontSize: 28,
  },
  studentInfo: {
    marginBottom: 6,
    fontSize: 16,
  },
  timesContainer: {
    marginTop: 4,
  },
  progressBar: {
    height: 12,
    marginTop: 20,
    marginBottom: 10,
  },
  progressText: {
    fontWeight: '700',
    marginBottom: 10,
    fontSize: 18,
  },
  remainingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  chipContainer: {
    marginTop: 10,
  },
  completeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  completeChipText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  entriesCard: {
    marginTop: 8,
  },
  entriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  resetButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 24,
    fontSize: 15,
  },
  listItem: {
    paddingVertical: 8,
  },
  dateEntryContainer: {
    position: 'relative',
  },
  fab: {
    position: 'absolute',
    marginRight: 16,
    right: 0,
    bottom: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    maxHeight: '90%',
    padding: 0,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontWeight: '700',
    fontSize: 24,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    maxHeight: '100%',
  },
  modalContentContainer: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  modalDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalInput: {
    marginBottom: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  modalButton: {
    marginTop: 16,
    marginBottom: 42,
  },
  notesContainer: {
    padding: 12,
    marginTop: 8,
    marginLeft: 16,
    marginRight: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  noteSection: {
    marginBottom: 8,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  tableScrollView: {
    marginHorizontal: -16,
  },
  tableContainer: {
    minWidth: 800,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    minHeight: 60,
  },
  tableHeader: {
    paddingVertical: 12,
    borderBottomWidth: 2,
  },
  tableCellHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'left',
  },
  tableCell: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  colEntryNumber: {
    width: 60,
  },
  colDateTime: {
    width: 180,
  },
  colTopics: {
    width: 250,
  },
  colRemarks: {
    width: 250,
  },
  colDelete: {
    width: 80,
  },
  tableCellText: {
    fontSize: 14,
    lineHeight: 20,
    flexWrap: 'wrap',
  },
  tableCellTextSmall: {
    fontSize: 12,
    marginTop: 2,
  },
  initialClassesText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
});
