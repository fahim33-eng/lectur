import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';

interface TimePickerProps {
  label: string;
  value: string; // Format: 'HH:mm' (24h)
  onChange: (time: string) => void;
  disabled?: boolean;
}

export function TimePicker({ label, value, onChange, disabled = false }: TimePickerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [showPicker, setShowPicker] = useState(false);

  // Parse time string to Date object (today with the time)
  const getDateFromTime = (timeStr: string): Date => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours || 0, minutes || 0, 0, 0);
    return date;
  };

  const [selectedTime, setSelectedTime] = useState<Date>(getDateFromTime(value || '10:00'));

  // Update selectedTime when value prop changes
  useEffect(() => {
    if (value) {
      setSelectedTime(getDateFromTime(value));
    }
  }, [value]);

  const handleTimeChange = (event: any, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
    }
    if (date) {
      setSelectedTime(date);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      onChange(`${hours}:${minutes}`);
      if (Platform.OS === 'ios') {
        setShowPicker(false);
      }
    }
  };

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return 'Select time';
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <View style={styles.container}>
      <ThemedText style={[styles.label, { color: colors.text }]}>{label}</ThemedText>
      <TouchableOpacity
        style={[
          styles.timeButton,
          {
            backgroundColor: colors.inputBackground,
            borderColor: colors.inputBorder,
          },
          disabled && { opacity: 0.5 },
        ]}
        onPress={() => !disabled && setShowPicker(true)}
        disabled={disabled}>
        <Text style={[styles.timeText, { color: colors.text }]}>
          {formatTime(value)}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={selectedTime}
          mode="time"
          is24Hour={false}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          textColor={colors.text}
          themeVariant={colorScheme || 'light'}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  timeButton: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 50,
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

