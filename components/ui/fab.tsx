import { TouchableOpacity, Text, StyleSheet, ViewStyle, Animated } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { IconSymbol } from './icon-symbol';
import { useEffect, useRef } from 'react';

interface FABProps {
  icon: string;
  label?: string;
  onPress: () => void;
  style?: ViewStyle;
}

export function FAB({ icon, label, onPress, style }: FABProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scaleAnim]);

  const fabStyle = [
    styles.fab,
    !label && styles.fabCircular, // Make it circular when no label
    {
      backgroundColor: colors.tint,
      shadowColor: colors.tint,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 10,
    },
    style,
  ];

  return (
    <TouchableOpacity
      style={fabStyle}
      onPress={onPress}
      activeOpacity={0.8}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <IconSymbol name={icon} size={label ? 26 : 28} color="#fff" />
      </Animated.View>
      {label && <Text style={styles.label}>{label}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
    borderRadius: 30,
    paddingHorizontal: 24,
  },
  fabCircular: {
    width: 60,
    height: 60,
    borderRadius: 30,
    paddingHorizontal: 0,
    minHeight: 60,
  },
  label: {
    color: '#fff',
    marginLeft: 10,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

