import { useColorScheme } from '@/hooks/use-color-scheme';
import * as SplashScreen from 'expo-splash-screen';
import LottieView from 'lottie-react-native';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export function SplashScreenComponent() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Hide splash screen after a short delay
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {
        // Ignore errors hiding splash screen
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const gradientColor = colorScheme === 'dark' ? '#1E293B' : '#BAE6FD';

  return (
    <View style={[styles.container, { backgroundColor: gradientColor }]}>
      <View style={styles.content}>
        <LottieView
          source={require('@/assets/images/splash.json')}
          autoPlay
          loop
          style={styles.animation}
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
  animation: {
    width: 200,
    height: 200,
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

