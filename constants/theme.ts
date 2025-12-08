/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// Modern vibrant colors
const primaryLight = '#6366F1'; // Indigo
const primaryDark = '#818CF8'; // Lighter indigo for dark mode
const secondaryLight = '#8B5CF6'; // Purple
const secondaryDark = '#A78BFA'; // Lighter purple for dark mode

export const Colors = {
  light: {
    text: '#1F2937', // Dark gray for excellent readability
    textSecondary: '#6B7280', // Medium gray for secondary text
    background: '#F9FAFB', // Very light gray background
    cardBackground: '#FFFFFF', // Pure white for cards
    border: '#E5E7EB', // Light border
    tint: primaryLight,
    icon: '#6B7280',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: primaryLight,
    // Status colors
    success: '#10B981', // Green
    warning: '#F59E0B', // Amber
    error: '#EF4444', // Red
    info: '#3B82F6', // Blue
    // Progress colors
    progressDefault: '#3B82F6', // Blue
    progressComplete: '#10B981', // Green
    // Input
    inputBackground: '#FFFFFF',
    inputBorder: '#D1D5DB',
    inputFocus: primaryLight,
  },
  dark: {
    text: '#F9FAFB', // Almost white for excellent readability
    textSecondary: '#D1D5DB', // Light gray for secondary text
    background: '#0F172A', // Very dark blue-gray
    cardBackground: '#1E293B', // Darker blue-gray for cards (contrasts with background)
    border: '#334155', // Medium dark border
    tint: primaryDark,
    icon: '#94A3B8',
    tabIconDefault: '#64748B',
    tabIconSelected: primaryDark,
    // Status colors
    success: '#34D399', // Lighter green for dark mode
    warning: '#FBBF24', // Lighter amber for dark mode
    error: '#F87171', // Lighter red for dark mode
    info: '#60A5FA', // Lighter blue for dark mode
    // Progress colors
    progressDefault: '#60A5FA', // Lighter blue for dark mode
    progressComplete: '#34D399', // Lighter green for dark mode
    // Input
    inputBackground: '#1E293B',
    inputBorder: '#475569',
    inputFocus: primaryDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
