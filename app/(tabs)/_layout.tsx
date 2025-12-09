import { Tabs } from 'expo-router';
import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom + 5,
          paddingTop: 5,
        },
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarIconStyle: {
          marginTop: 2,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('@/assets/images/tabs/overview.png')}
              style={[
                styles.tabIcon,
                { 
                  opacity: focused ? 1 : 0.6,
                  tintColor: focused ? colors.tint : colors.tabIconDefault,
                },
              ]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('@/assets/images/tabs/students.png')}
              style={[
                styles.tabIcon,
                { 
                  opacity: focused ? 1 : 0.6,
                  tintColor: focused ? colors.tint : colors.tabIconDefault,
                },
              ]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('@/assets/images/tabs/calendar.png')}
              style={[
                styles.tabIcon,
                { 
                  opacity: focused ? 1 : 0.6,
                  tintColor: focused ? colors.tint : colors.tabIconDefault,
                },
              ]}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="fees"
        options={{
          title: 'Fees',
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('@/assets/images/fees.png')}
              style={[
                styles.tabIcon,
                { 
                  opacity: focused ? 1 : 0.6,
                  tintColor: focused ? colors.tint : colors.tabIconDefault,
                },
              ]}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabIcon: {
    width: 24,
    height: 24,
  },
});
