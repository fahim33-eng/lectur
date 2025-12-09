import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GuidelineScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      >
        <ThemedText type="title" style={styles.title}>
          App Guidelines
        </ThemedText>
        <ThemedText style={[styles.subtitle, { color: colors.textSecondary }]}>
          Learn how to use all features of the Lectur app
        </ThemedText>

        <Card style={styles.sectionCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            📚 Overview Tab
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            The Overview tab shows you all classes scheduled for today. You can see which students have classes and at what times. Tap on any student card to view their details or edit their schedule.
          </ThemedText>
        </Card>

        <Card style={styles.sectionCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            👥 Students Tab
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            Manage all your students here. You can:
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={styles.bulletPoint}>• Add new students with their weekly schedule</ThemedText>
            <ThemedText style={styles.bulletPoint}>• Set class times for each weekday (Friday, Saturday, etc.)</ThemedText>
            <ThemedText style={styles.bulletPoint}>• Configure classes per cycle (default: 12 classes)</ThemedText>
            <ThemedText style={styles.bulletPoint}>• Set tuition fees per cycle</ThemedText>
            <ThemedText style={styles.bulletPoint}>• Track initial classes completed when adding a student</ThemedText>
            <ThemedText style={styles.bulletPoint}>• Edit or delete student information</ThemedText>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            📅 Calendar Tab
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            View your teaching schedule in a calendar format. You can:
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={styles.bulletPoint}>• See all scheduled classes for any date</ThemedText>
            <ThemedText style={styles.bulletPoint}>• Add one-time schedules for specific dates</ThemedText>
            <ThemedText style={styles.bulletPoint}>• View class entries (completed classes) for each date</ThemedText>
            <ThemedText style={styles.bulletPoint}>• Edit or delete schedules and entries</ThemedText>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            💰 Fees Tab
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            Track all fee payments and earnings. Here's how it works:
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={styles.bulletPoint}>• <ThemedText style={styles.bold}>Automatic Entry:</ThemedText> When a student completes their cycle (reaches the number of classes per cycle), a fee entry is automatically created with status "Payment Due"</ThemedText>
            <ThemedText style={styles.bulletPoint}>• <ThemedText style={styles.bold}>Manual Entry:</ThemedText> You can manually add fee entries by tapping the "Add Fee" button. Select a student, enter the amount and month/cycle</ThemedText>
            <ThemedText style={styles.bulletPoint}>• <ThemedText style={styles.bold}>Payment Status:</ThemedText> Tap on the status column to toggle between "Payment Due" and "Completed"</ThemedText>
            <ThemedText style={styles.bulletPoint}>• <ThemedText style={styles.bold}>Filtering:</ThemedText> Filter fees by student or view all students</ThemedText>
            <ThemedText style={styles.bulletPoint}>• <ThemedText style={styles.bold}>Charts:</ThemedText> View monthly earnings in a visual chart format</ThemedText>
            <ThemedText style={styles.bulletPoint}>• <ThemedText style={styles.bold}>Total Earnings:</ThemedText> See the sum of all completed fee entries</ThemedText>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            🔔 Notification Reminders
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            The app sends automatic reminders for your classes:
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={styles.bulletPoint}>• <ThemedText style={styles.bold}>Timing:</ThemedText> You'll receive a notification 1 hour before each scheduled class</ThemedText>
            <ThemedText style={styles.bulletPoint}>• <ThemedText style={styles.bold}>Message:</ThemedText> "You have a class with [Student Name] in 1 hour"</ThemedText>
            <ThemedText style={styles.bulletPoint}>• <ThemedText style={styles.bold}>Scheduling:</ThemedText> Notifications are automatically scheduled for the next 4 weeks when you add or edit a student</ThemedText>
            <ThemedText style={styles.bulletPoint}>• <ThemedText style={styles.bold}>Permissions:</ThemedText> Make sure to grant notification permissions when prompted</ThemedText>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            📝 Adding Class Entries
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            When you complete a class with a student:
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={styles.bulletPoint}>• Go to the student's detail page (tap on student card)</ThemedText>
            <ThemedText style={styles.bulletPoint}>• Tap the "+" button (FAB) at the bottom right</ThemedText>
            <ThemedText style={styles.bulletPoint}>• Optionally add topics covered and remarks/homework</ThemedText>
            <ThemedText style={styles.bulletPoint}>• Save the entry</ThemedText>
            <ThemedText style={styles.bulletPoint}>• <ThemedText style={styles.bold}>Automatic Fee Entry:</ThemedText> When the student completes their cycle (reaches classes per cycle), a fee entry is automatically added to the Fees tab</ThemedText>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            💡 Tips & Best Practices
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={styles.bulletPoint}>• Keep your student schedules up to date for accurate notifications</ThemedText>
            <ThemedText style={styles.bulletPoint}>• Regularly update payment status in the Fees tab to track completed payments</ThemedText>
            <ThemedText style={styles.bulletPoint}>• Use the Calendar tab to plan ahead and see your full schedule</ThemedText>
            <ThemedText style={styles.bulletPoint}>• Add class entries after each session to automatically track when cycles complete</ThemedText>
            <ThemedText style={styles.bulletPoint}>• Use manual fee entries for any special payments or adjustments</ThemedText>
          </View>
        </Card>

        <Card style={[styles.sectionCard, { backgroundColor: colors.tint + '10' }]}>
          <ThemedText type="subtitle" style={[styles.sectionTitle, { color: colors.tint }]}>
            ⚙️ How Cycles Work
          </ThemedText>
          <ThemedText style={styles.sectionText}>
            A cycle is a set number of classes (default: 12) that a student completes before a fee is due. For example:
          </ThemedText>
          <View style={styles.bulletList}>
            <ThemedText style={styles.bulletPoint}>• Student has 12 classes per cycle</ThemedText>
            <ThemedText style={styles.bulletPoint}>• You add class entries as you complete each class</ThemedText>
            <ThemedText style={styles.bulletPoint}>• When the 12th class entry is added, a fee entry is automatically created</ThemedText>
            <ThemedText style={styles.bulletPoint}>• The fee entry appears in the Fees tab with status "Payment Due"</ThemedText>
            <ThemedText style={styles.bulletPoint}>• Once payment is received, update the status to "Completed"</ThemedText>
          </View>
        </Card>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  title: {
    fontWeight: '700',
    fontSize: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  sectionCard: {
    padding: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontWeight: '700',
    fontSize: 20,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletList: {
    marginTop: 8,
    gap: 8,
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 22,
  },
  bold: {
    fontWeight: '700',
  },
});

