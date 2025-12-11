import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Card } from '@/components/ui/card';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Linking from 'expo-linking';
import React from 'react';
import { Alert, Image, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';

interface CallModalProps {
  visible: boolean;
  onClose: () => void;
  studentName: string;
  mobileNumber: string;
}

export function CallModal({ visible, onClose, studentName, mobileNumber }: CallModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const formatPhoneNumberForCall = (number: string): string => {
    // Just remove spaces, dashes, and plus signs - don't manipulate the number
    return number.replace(/[\s\-+]/g, '');
  };

  const formatPhoneNumberForWhatsApp = (number: string): string => {
    // Remove spaces, dashes, and plus signs
    let cleaned = number.replace(/[\s\-+]/g, '');
    
    // If already starts with 880, use as is
    if (cleaned.startsWith('880')) {
      return cleaned;
    }
    
    // If starts with 01, remove the 0 and add 880
    if (cleaned.startsWith('01')) {
      return `880${cleaned.substring(1)}`;
    }
    
    // If starts with 1, add 880
    if (cleaned.startsWith('1')) {
      return `880${cleaned}`;
    }
    
    // Otherwise, assume it's a local number starting with 0, remove 0 and add 880
    if (cleaned.startsWith('0')) {
      return `880${cleaned.substring(1)}`;
    }
    
    // Fallback: add 880
    return `880${cleaned}`;
  };

  const handleDirectCall = () => {
    const phoneNumber = formatPhoneNumberForCall(mobileNumber);
    const url = `tel:${phoneNumber}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Failed to initiate phone call');
    });
    
    onClose();
  };

  const handleWhatsAppCall = () => {
    const whatsappNumber = formatPhoneNumberForWhatsApp(mobileNumber);
    const url = `https://wa.me/${whatsappNumber}`;
    
    // Try to open WhatsApp directly - don't check first as canOpenURL might not work correctly
    Linking.openURL(url).catch(() => {
      // If it fails, try alternative WhatsApp URL format
      const altUrl = `whatsapp://send?phone=${whatsappNumber}`;
      Linking.openURL(altUrl).catch(() => {
        Alert.alert('Error', 'Failed to open WhatsApp. Please make sure WhatsApp is installed.');
      });
    });
    
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Card style={styles.modalCard}>
          <ThemedText type="title" style={styles.modalTitle}>
            Call {studentName}
          </ThemedText>
          
          <ThemedText style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
            Choose how you want to call
          </ThemedText>

          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={handleDirectCall}>
              <Image
                source={require('@/assets/images/direct_call.png')}
                style={styles.optionIcon}
                resizeMode="contain"
              />
              <ThemedText style={styles.optionText}>Direct Call</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.optionButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
              onPress={handleWhatsAppCall}>
              <Image
                source={require('@/assets/images/whatsapp.png')}
                style={styles.optionIcon}
                resizeMode="contain"
              />
              <ThemedText style={styles.optionText}>WhatsApp</ThemedText>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.background }]}
            onPress={onClose}>
            <ThemedText style={[styles.cancelButtonText, { color: colors.textSecondary }]}>
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  optionsContainer: {
    gap: 12,
    marginBottom: 16,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    gap: 16,
  },
  optionIcon: {
    width: 40,
    height: 40,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

