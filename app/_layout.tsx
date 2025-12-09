import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SplashScreenComponent } from '@/components/splash-screen';
import { notificationService } from '@/services/notifications';

// Keep splash screen visible while we load resources
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let initializationTimeout: NodeJS.Timeout;

    // Initialize app with proper error handling
    const initializeApp = async () => {
      try {
        // Request notification permissions (non-blocking)
        if (notificationService.isAvailable()) {
          // Don't await - let it run in background
          notificationService.requestPermissions().catch(() => {
            // Silently fail - permissions can be requested later
          });
          
          // Reschedule notifications in background (non-blocking)
          // Use setTimeout to ensure it doesn't block app startup
          setTimeout(() => {
            notificationService.rescheduleAllNotifications().catch(() => {
              // Silently fail - can retry later
            });
          }, 2000);
        }
        
        // Minimum splash screen time for smooth UX
        initializationTimeout = setTimeout(() => {
          if (isMounted) {
            setIsReady(true);
            SplashScreen.hideAsync().catch(() => {
              // Ignore errors hiding splash screen
            });
          }
        }, 800);
      } catch (error) {
        console.error('App initialization error:', error);
        // Still show app even if initialization fails
        if (isMounted) {
          setIsReady(true);
          SplashScreen.hideAsync().catch(() => {});
        }
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
      if (initializationTimeout) {
        clearTimeout(initializationTimeout);
      }
    };
  }, []);

  // Handle app state changes separately
  useEffect(() => {
    if (!isReady) return;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App came to foreground - optionally refresh notifications
        if (notificationService.isAvailable()) {
          // Reschedule in background without blocking
          setTimeout(() => {
            notificationService.rescheduleAllNotifications().catch(() => {});
          }, 1000);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isReady]);

  if (!isReady) {
    return <SplashScreenComponent />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'default',
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="student/[id]" 
          options={{ 
            presentation: 'card', 
            title: 'Student Details',
            animation: 'slide_from_right',
          }} 
        />
        <Stack.Screen 
          name="add-student" 
          options={{ 
            presentation: 'modal', 
            title: 'Add Student',
            animation: 'slide_from_bottom',
          }} 
        />
        <Stack.Screen 
          name="edit-student/[id]" 
          options={{ 
            presentation: 'modal', 
            title: 'Edit Student',
            animation: 'slide_from_bottom',
          }} 
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
