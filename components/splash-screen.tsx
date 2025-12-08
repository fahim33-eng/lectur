import { useEffect } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from '@/hooks/use-color-scheme';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export function SplashScreenComponent() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Hide splash screen after a short delay
    const timer = setTimeout(() => {
      SplashScreen.hideAsync();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const gradientColor = colorScheme === 'dark' ? '#1E293B' : '#BAE6FD';

  return (
    <View style={[styles.container, { backgroundColor: gradientColor }]}>
      <View style={styles.content}>
        <Image 
          source={require('@/assets/images/icon.png')} 
          style={styles.icon}
          resizeMode="contain"
        />
        <Text style={styles.appName}>
          Lectur
        </Text>
        <Text style={[styles.appTagline, { color: colorScheme === 'dark' ? '#94A3B8' : '#475569' }]}>
          Manage Your Tuition Classes
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  appName: {
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
    fontFamily: 'system-ui',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  appTagline: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
    letterSpacing: 0.5,
  },
});

