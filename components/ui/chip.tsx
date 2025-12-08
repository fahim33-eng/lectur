import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface ChipProps {
  children: React.ReactNode;
  selected?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Chip({ children, selected = false, onPress, style }: ChipProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const chipStyle = [
    styles.chip,
    selected
      ? { 
          backgroundColor: colors.tint, 
          borderColor: colors.tint,
          shadowColor: colors.tint,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 3,
        }
      : {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
    style,
  ];

  const textStyle = [
    styles.text,
    selected ? { color: '#fff' } : { color: colors.text },
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={chipStyle} onPress={onPress} activeOpacity={0.7}>
        <Text style={textStyle}>{children}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <Text style={[chipStyle, textStyle]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
    marginRight: 10,
    marginBottom: 10,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

