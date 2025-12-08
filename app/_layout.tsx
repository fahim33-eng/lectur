import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { SplashScreenComponent } from '@/components/splash-screen';
import { notificationService } from '@/services/notifications';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Request notification permissions and reschedule notifications
    const initializeApp = async () => {
      // Only try to use notifications if available (not in Expo Go)
      if (notificationService.isAvailable()) {
        await notificationService.requestPermissions();
        await notificationService.rescheduleAllNotifications();
      }
      
      // Simulate app initialization
      setTimeout(() => {
        setIsReady(true);
      }, 1500);
    };

    initializeApp();
  }, []);

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
