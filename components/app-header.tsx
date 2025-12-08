import { View, StyleSheet, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AppHeaderProps {
  showIcon?: boolean;
  compact?: boolean;
}

export function AppHeader({ showIcon = true, compact = false }: AppHeaderProps) {
  const colorScheme = useColorScheme();
  const gradientColor = colorScheme === 'dark' ? '#334155' : '#BAE6FD';

  return (
    <View style={[styles.container, compact && styles.compact, { backgroundColor: gradientColor }]}>
      {showIcon && (
        <Image 
          source={require('@/assets/images/icon.png')} 
          style={[styles.icon, compact && styles.iconCompact]}
          resizeMode="contain"
        />
      )}
      <ThemedText style={[styles.appName, compact && styles.appNameCompact]}>
        Lectur
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    marginBottom: 16,
    marginHorizontal: 16,
    marginTop: 8,
  },
  compact: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    marginTop: 4,
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  iconCompact: {
    width: 32,
    height: 32,
    marginRight: 10,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  appNameCompact: {
    fontSize: 22,
    letterSpacing: 1.5,
  },
});

