import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { IconSymbol } from './icon-symbol';

interface ListItemProps {
  title: string;
  leftIcon?: string;
  leftText?: string;
  rightIcon?: string;
  onPress?: () => void;
  onRightPress?: () => void;
  style?: ViewStyle;
}

export function ListItem({ title, leftIcon, leftText, rightIcon, onPress, onRightPress, style }: ListItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: colors.border }, style]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}>
      {leftIcon && (
        <View style={styles.leftIcon}>
          <IconSymbol name={leftIcon} size={22} color={colors.tint} />
        </View>
      )}
      {leftText && (
        <View style={[styles.leftTextContainer, { backgroundColor: colors.tint + '20' }]}>
          <Text style={[styles.leftText, { color: colors.tint }]}>{leftText}</Text>
        </View>
      )}
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      {rightIcon && (
        <TouchableOpacity onPress={onRightPress} style={styles.rightIcon} activeOpacity={0.7}>
          <IconSymbol name={rightIcon} size={20} color={colors.error} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
  },
  leftIcon: {
    marginRight: 16,
  },
  leftTextContainer: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    paddingHorizontal: 8,
  },
  leftText: {
    fontSize: 14,
    fontWeight: '700',
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  rightIcon: {
    marginLeft: 16,
    padding: 6,
  },
});

