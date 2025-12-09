import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Input } from '@/components/ui/input';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { storageService } from '@/services/storage';
import { FeeEntry, Student } from '@/types';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Dimensions, Modal, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';

export default function FeesScreen() {
  const [feeEntries, setFeeEntries] = useState<FeeEntry[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [showChart, setShowChart] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showAddFeeModal, setShowAddFeeModal] = useState(false);
  const [studentModalFor, setStudentModalFor] = useState<'filter' | 'manual'>('filter');
  const [manualStudentId, setManualStudentId] = useState<string>('');
  const [manualAmount, setManualAmount] = useState<string>('');
  const [manualMonth, setManualMonth] = useState<string>('');
  const router = useRouter();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme ?? 'light'];

  const loadData = useCallback(async () => {
    const fees = await storageService.getFeeEntries();
    const studentsData = await storageService.getStudents();
    setFeeEntries(fees);
    setStudents(studentsData);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Filter fee entries by selected student
  const filteredEntries = useMemo(() => {
    if (selectedStudentId === 'all') {
      return feeEntries;
    }
    return feeEntries.filter(entry => entry.studentId === selectedStudentId);
  }, [feeEntries, selectedStudentId]);

  // Sort entries by date (newest first)
  const sortedEntries = useMemo(() => {
    return [...filteredEntries].sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [filteredEntries]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const monthlyData: Record<string, number> = {};
    
    filteredEntries.forEach(entry => {
      const monthKey = entry.month;
      if (monthlyData[monthKey]) {
        monthlyData[monthKey] += entry.amount;
      } else {
        monthlyData[monthKey] = entry.amount;
      }
    });

    // Sort months by parsing the month string
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
      // Try to parse as date, if fails, use string comparison
      const dateA = new Date(a);
      const dateB = new Date(b);
      if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.localeCompare(b);
    });

    return {
      labels: sortedMonths.map(month => {
        // Try to parse and format, otherwise use first 3 chars
        const date = new Date(month);
        if (!isNaN(date.getTime())) {
          return date.toLocaleDateString('en-US', { month: 'short' });
        }
        // If parsing fails, use first 3 characters
        return month.substring(0, 3);
      }),
      datasets: [{
        data: sortedMonths.map(month => monthlyData[month]),
        color: (opacity = 1) => colors.tint,
        strokeWidth: 2,
      }],
    };
  }, [filteredEntries, colors.tint]);

  const screenWidth = Dimensions.get('window').width;

  const formatCurrency = (amount: number) => {
    return `৳${amount.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const handleStatusUpdate = async (entry: FeeEntry) => {
    const newStatus: 'Payment Due' | 'Completed' = entry.status === 'Completed' ? 'Payment Due' : 'Completed';
    const updatedEntry: FeeEntry = {
      ...entry,
      status: newStatus,
    };
    try {
      await storageService.saveFeeEntry(updatedEntry);
      await loadData();
      Alert.alert('Success', `Payment status updated to ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update payment status');
      console.error(error);
    }
  };

  const handleAddManualFee = async () => {
    if (!manualStudentId) {
      Alert.alert('Error', 'Please select a student');
      return;
    }
    if (!manualAmount || isNaN(Number(manualAmount)) || Number(manualAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!manualMonth.trim()) {
      Alert.alert('Error', 'Please enter a month/cycle');
      return;
    }

    const selectedStudent = students.find(s => s.id === manualStudentId);
    if (!selectedStudent) {
      Alert.alert('Error', 'Selected student not found');
      return;
    }

    try {
      const feeEntry: FeeEntry = {
        id: Date.now().toString() + '_fee_manual',
        studentId: manualStudentId,
        studentName: selectedStudent.name,
        amount: Number(manualAmount),
        month: manualMonth.trim(),
        date: new Date().toISOString().split('T')[0],
        status: 'Payment Due',
        createdAt: new Date().toISOString(),
      };
      await storageService.saveFeeEntry(feeEntry);
      await loadData();
      setShowAddFeeModal(false);
      setManualStudentId('');
      setManualAmount('');
      setManualMonth('');
      Alert.alert('Success', 'Fee entry added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add fee entry');
      console.error(error);
    }
  };

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        
        <Card style={styles.filterCard}>
          <ThemedText type="subtitle" style={styles.filterLabel}>
            Filter by Student
          </ThemedText>
          <TouchableOpacity
            style={[styles.selectContainer, { borderColor: colors.border }]}
            onPress={() => {
              setStudentModalFor('filter');
              setShowStudentModal(true);
            }}
          >
            <View style={styles.selectWrapper}>
              <ThemedText style={styles.selectText}>
                {selectedStudentId === 'all' 
                  ? 'All Students' 
                  : students.find(s => s.id === selectedStudentId)?.name || 'All Students'}
              </ThemedText>
              <IconSymbol name="chevron.down" size={16} color={colors.textSecondary} />
            </View>
          </TouchableOpacity>

          <Modal
            visible={showStudentModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowStudentModal(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowStudentModal(false)}
            >
              <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                {studentModalFor === 'filter' ? (
                  <>
                    <TouchableOpacity
                      style={[styles.modalOption, selectedStudentId === 'all' && { backgroundColor: colors.tint + '20' }]}
                      onPress={() => {
                        setSelectedStudentId('all');
                        setShowStudentModal(false);
                      }}
                    >
                      <ThemedText style={styles.modalOptionText}>All Students</ThemedText>
                      {selectedStudentId === 'all' && (
                        <IconSymbol name="checkmark" size={20} color={colors.tint} />
                      )}
                    </TouchableOpacity>
                    {students.map(student => (
                      <TouchableOpacity
                        key={student.id}
                        style={[styles.modalOption, selectedStudentId === student.id && { backgroundColor: colors.tint + '20' }]}
                        onPress={() => {
                          setSelectedStudentId(student.id);
                          setShowStudentModal(false);
                        }}
                      >
                        <ThemedText style={styles.modalOptionText}>{student.name}</ThemedText>
                        {selectedStudentId === student.id && (
                          <IconSymbol name="checkmark" size={20} color={colors.tint} />
                        )}
                      </TouchableOpacity>
                    ))}
                  </>
                ) : (
                  students.map(student => (
                    <TouchableOpacity
                      key={student.id}
                      style={[styles.modalOption, manualStudentId === student.id && { backgroundColor: colors.tint + '20' }]}
                      onPress={() => {
                        setManualStudentId(student.id);
                        setShowStudentModal(false);
                      }}
                    >
                      <ThemedText style={styles.modalOptionText}>{student.name}</ThemedText>
                      {manualStudentId === student.id && (
                        <IconSymbol name="checkmark" size={20} color={colors.tint} />
                      )}
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </TouchableOpacity>
          </Modal>
        </Card>

        <View style={styles.headerRow}>
          <ThemedText type="title" style={styles.title}>
            Fee Records
          </ThemedText>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              onPress={() => setShowAddFeeModal(true)}
              style={[styles.addButton, { backgroundColor: colors.tint }]}
            >
              <IconSymbol name="plus" size={18} color="#FFFFFF" />
              <ThemedText style={styles.addButtonText}>Add Fee</ThemedText>
            </TouchableOpacity>
            {sortedEntries.length > 0 && (
              <TouchableOpacity
                onPress={() => setShowChart(!showChart)}
                style={[styles.chartButton, { backgroundColor: colors.tint + '20' }]}
              >
                <IconSymbol 
                  name={showChart ? "chart.bar.fill" : "chart.line.uptrend.xyaxis"} 
                  size={20} 
                  color={colors.tint} 
                />
                <ThemedText style={[styles.chartButtonText, { color: colors.tint }]}>
                  {showChart ? 'Hide Chart' : 'Show Chart'}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {showChart && sortedEntries.length > 0 && (
          <Card style={styles.chartCard}>
            <ThemedText type="subtitle" style={styles.chartTitle}>
              Monthly Earnings
            </ThemedText>
            {chartData.labels.length > 0 ? (
              <LineChart
                data={chartData}
                width={screenWidth - 64}
                height={220}
                chartConfig={{
                  backgroundColor: colors.cardBackground,
                  backgroundGradientFrom: colors.cardBackground,
                  backgroundGradientTo: colors.cardBackground,
                  decimalPlaces: 0,
                  color: (opacity = 1) => colors.tint,
                  labelColor: (opacity = 1) => colors.text,
                  style: {
                    borderRadius: 16,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: colors.tint,
                  },
                }}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                }}
                withInnerLines={false}
                withOuterLines={true}
                withVerticalLines={false}
                withHorizontalLines={true}
              />
            ) : (
              <ThemedText style={[styles.emptyChartText, { color: colors.textSecondary }]}>
                No data available for chart
              </ThemedText>
            )}
          </Card>
        )}

        {sortedEntries.length === 0 ? (
          <Card style={styles.emptyCard}>
            <ThemedText style={[styles.emptyText, { color: colors.textSecondary }]}>
              {selectedStudentId === 'all' 
                ? 'No fee records yet. Fees will be automatically added when a cycle is completed.' 
                : 'No fee records for this student yet.'}
            </ThemedText>
          </Card>
        ) : (
          <View style={styles.tableContainer}>
            <View style={[styles.tableHeader, { backgroundColor: colors.tint + '20' }]}>
              <View style={styles.colStudent}>
                <ThemedText style={[styles.tableHeaderText, { color: colors.tint }]}>
                  Student
                </ThemedText>
              </View>
              <View style={styles.colMonth}>
                <ThemedText style={[styles.tableHeaderText, { color: colors.tint }]}>
                  Month
                </ThemedText>
              </View>
              <View style={styles.colAmount}>
                <ThemedText style={[styles.tableHeaderText, { color: colors.tint }]}>
                  Amount
                </ThemedText>
              </View>
              <View style={styles.colStatus}>
                <ThemedText style={[styles.tableHeaderText, { color: colors.tint }]}>
                  Status
                </ThemedText>
              </View>
              <View style={styles.colDate}>
                <ThemedText style={[styles.tableHeaderText, { color: colors.tint }]}>
                  Date
                </ThemedText>
              </View>
            </View>

            {sortedEntries.map((entry) => (
              <View 
                key={entry.id} 
                style={[styles.tableRow, { borderBottomColor: colors.border }]}
              >
                <View style={styles.colStudent}>
                  <ThemedText style={styles.tableCellText} numberOfLines={1}>
                    {entry.studentName}
                  </ThemedText>
                </View>
                <View style={styles.colMonth}>
                  <ThemedText style={styles.tableCellText} numberOfLines={1}>
                    {entry.month}
                  </ThemedText>
                </View>
                <View style={styles.colAmount}>
                  <ThemedText style={[styles.tableCellText, { fontWeight: '700', color: colors.tint }]}>
                    {formatCurrency(entry.amount)}
                  </ThemedText>
                </View>
                <TouchableOpacity 
                  style={styles.colStatus}
                  onPress={() => handleStatusUpdate(entry)}
                >
                  <ThemedText style={[
                    styles.tableCellText, 
                    { 
                      color: (entry.status || 'Payment Due') === 'Completed' ? '#4CAF50' : '#FF9800',
                      fontWeight: '600'
                    }
                  ]}>
                    {entry.status || 'Payment Due'}
                  </ThemedText>
                </TouchableOpacity>
                <View style={styles.colDate}>
                  <ThemedText style={[styles.tableCellText, { color: colors.textSecondary }]}>
                    {formatDate(entry.date)}
                  </ThemedText>
                </View>
              </View>
            ))}
          </View>
        )}

        {sortedEntries.length > 0 && (
          <Card style={styles.summaryCard}>
            <ThemedText type="subtitle" style={styles.summaryTitle}>
              Total Earnings
            </ThemedText>
            <ThemedText style={[styles.summaryAmount, { color: colors.tint }]}>
              {formatCurrency(sortedEntries.reduce((sum, entry) => sum + entry.amount, 0))}
            </ThemedText>
          </Card>
        )}

        {/* Add Manual Fee Modal */}
        <Modal
          visible={showAddFeeModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            setShowAddFeeModal(false);
            setManualStudentId('');
            setManualAmount('');
            setManualMonth('');
          }}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: colors.cardBackground }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <ThemedText type="title" style={styles.modalTitle}>
                Add Manual Fee Entry
              </ThemedText>
                <TouchableOpacity
                  onPress={() => {
                    setShowAddFeeModal(false);
                    setManualStudentId('');
                    setManualAmount('');
                    setManualMonth('');
                  }}
                  style={styles.modalCloseButton}
                >
                  <IconSymbol name="xmark" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalContent}>
                <ThemedText style={[styles.modalLabel, { color: colors.textSecondary }]}>
                  Select Student
                </ThemedText>
                <TouchableOpacity
                  style={[styles.selectContainer, { borderColor: colors.border }]}
                  onPress={() => {
                    setStudentModalFor('manual');
                    setShowStudentModal(true);
                  }}
                >
                  <View style={styles.selectWrapper}>
                    <ThemedText style={[styles.selectText, { color: manualStudentId ? colors.text : colors.textSecondary }]}>
                      {manualStudentId 
                        ? students.find(s => s.id === manualStudentId)?.name || 'Select Student'
                        : 'Select Student'}
                    </ThemedText>
                    <IconSymbol name="chevron.down" size={16} color={colors.textSecondary} />
                  </View>
                </TouchableOpacity>

                <ThemedText style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 16 }]}>
                  Amount (৳)
                </ThemedText>
                <Input
                  value={manualAmount}
                  onChangeText={setManualAmount}
                  placeholder="Enter amount"
                  keyboardType="numeric"
                  style={styles.modalInput}
                />

                <ThemedText style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 16 }]}>
                  Month/Cycle
                </ThemedText>
                <Input
                  value={manualMonth}
                  onChangeText={setManualMonth}
                  placeholder="e.g., December 2024, Cycle 1"
                  style={styles.modalInput}
                />

                <Button
                  title="Add Fee Entry"
                  onPress={handleAddManualFee}
                  style={styles.modalButton}
                />
              </ScrollView>
            </View>
          </View>
        </Modal>
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
  filterCard: {
    marginBottom: 8,
    padding: 16,
  },
  filterLabel: {
    marginBottom: 12,
    fontWeight: '700',
    fontSize: 16,
  },
  selectContainer: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  selectText: {
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 8,
    minWidth: 280,
    maxWidth: '80%',
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  modalOptionText: {
    fontSize: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontWeight: '700',
    fontSize: 28,
  },
  chartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  chartButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartCard: {
    marginBottom: 8,
    padding: 16,
  },
  chartTitle: {
    marginBottom: 12,
    fontWeight: '700',
    fontSize: 18,
  },
  emptyChartText: {
    textAlign: 'center',
    paddingVertical: 40,
    fontSize: 14,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  tableContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  colStudent: {
    flex: 2,
  },
  colMonth: {
    flex: 2,
  },
  colAmount: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  colStatus: {
    flex: 1.5,
    alignItems: 'center',
  },
  colDate: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  tableCellText: {
    fontSize: 14,
    lineHeight: 20,
  },
  summaryCard: {
    padding: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    marginBottom: 8,
    fontWeight: '600',
    fontSize: 16,
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontWeight: '700',
    fontSize: 20,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  modalInput: {
    marginBottom: 0,
  },
  modalButton: {
    marginTop: 24,
  },
});

