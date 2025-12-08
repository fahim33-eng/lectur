import { View, TouchableOpacity, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
}

export function Card({ children, onPress, style, elevated = false }: CardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.cardBackground,
      borderColor: colors.border,
      borderWidth: 1,
      shadowColor: colorScheme === 'dark' ? '#000' : '#000',
      shadowOffset: { width: 0, height: elevated ? 4 : 0 },
      shadowOpacity: elevated ? (colorScheme === 'dark' ? 0.3 : 0.1) : 0,
      shadowRadius: elevated ? 8 : 0,
      elevation: elevated ? 6 : 0,
    },
    style,
  ];

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    maxWidth: '100%',
  },
});

