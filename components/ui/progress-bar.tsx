import { View, StyleSheet, ViewStyle } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  color?: string;
  style?: ViewStyle;
}

export function ProgressBar({ progress, color, style }: ProgressBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const progressColor = color || colors.progressDefault;

  return (
    <View style={[styles.container, { backgroundColor: colors.border }, style]}>
      <View 
        style={[
          styles.progress, 
          { 
            width: `${Math.min(progress * 100, 100)}%`, 
            backgroundColor: progressColor,
            shadowColor: progressColor,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 3,
          }
        ]} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: 5,
  },
});

