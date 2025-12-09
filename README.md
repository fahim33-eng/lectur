# Lectur - Tuition Management App

Lectur is a comprehensive mobile application designed to help private tutors manage their students, schedules, class entries, and fee payments efficiently. Built with React Native and Expo, Lectur provides an intuitive interface for organizing your teaching business.

## Features

- **Student Management**: Add, edit, and manage student information including weekly schedules, class times, and tuition fees
- **Class Scheduling**: Set up weekly recurring schedules and one-time schedules for specific dates
- **Class Entries**: Track completed classes with topics covered and homework assignments
- **Fee Management**: Automatically track fees when cycles complete, manually add fee entries, and manage payment status
- **Calendar View**: Visual calendar interface to view all scheduled classes and completed sessions
- **Notifications**: Receive reminders 1 hour before each scheduled class
- **Analytics**: View monthly earnings with interactive charts
- **Payment Tracking**: Track payment status (Payment Due/Completed) for each fee entry

## Technology Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Storage**: AsyncStorage (local device storage)
- **Notifications**: Expo Notifications
- **Charts**: React Native Chart Kit

## Development

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd lectur
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

4. Run on your preferred platform:
   - Press `a` for Android emulator
   - Press `i` for iOS simulator
   - Scan QR code with Expo Go app for physical device

### Building for Production

#### Android

```bash
eas build --platform android
```

#### iOS

```bash
eas build --platform ios
```

## Privacy Policy

**Last Updated**: [Date]

### Introduction

Lectur ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use our mobile application.

### Information We Collect

Lectur is designed with privacy in mind. We collect and store the following information locally on your device:

1. **Student Information**:
   - Student names
   - Weekly schedules (days and times)
   - Number of classes per cycle
   - Initial classes completed
   - Tuition fees per cycle

2. **Class Data**:
   - Class entry dates
   - Topics covered in each class
   - Remarks and homework assignments

3. **Schedule Information**:
   - Weekly recurring schedules
   - One-time schedules for specific dates

4. **Fee Records**:
   - Fee amounts
   - Payment status (Payment Due/Completed)
   - Month/cycle identifiers
   - Payment dates

### Data Storage and Security

- **Local Storage Only**: All data is stored exclusively on your device using AsyncStorage. No data is transmitted to external servers or third-party services.
- **No Cloud Sync**: Your data remains on your device and is not synchronized to any cloud service.
- **No Account Required**: Lectur does not require user registration or account creation.
- **Device Security**: Data is stored using secure local storage mechanisms provided by the operating system.

### Data Collection and Sharing

- **No Data Transmission**: We do not collect, transmit, or share any of your data with external servers, third parties, or analytics services.
- **No Analytics**: We do not use analytics tools, tracking services, or advertising networks.
- **No Personal Identifiers**: We do not collect personal identifiers such as email addresses, phone numbers, or device IDs.
- **No Location Data**: We do not collect or track your location.

### Permissions

Lectur requests the following permissions:

1. **Notification Permission**: Required to send class reminder notifications. This permission is optional and can be denied without affecting core app functionality.

### Data Deletion

- You can delete any student, class entry, schedule, or fee record at any time through the app interface.
- Deleting a student will automatically delete all associated class entries, schedules, and fee records.
- To completely remove all data, uninstall the app from your device.

### Children's Privacy

Lectur is designed for use by tutors and teachers. We do not knowingly collect information from children under the age of 13. If you are a parent or guardian and believe your child has provided us with information, please contact us immediately.

### Third-Party Services

Lectur uses the following third-party services for core functionality:

- **Expo**: Development framework and build services
- **React Native**: Mobile app framework
- **AsyncStorage**: Local data storage (provided by React Native)

These services are used solely for app functionality and do not involve data transmission or collection.

### Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by updating the "Last Updated" date at the top of this policy. You are advised to review this Privacy Policy periodically for any changes.

### Your Rights

You have the following rights regarding your data:

- **Access**: All your data is accessible through the app interface
- **Modification**: You can edit or update any information at any time
- **Deletion**: You can delete any data or uninstall the app to remove all information
- **Control**: You have full control over all data stored in the app

### Data Retention

- Data is retained on your device until you manually delete it or uninstall the app
- We do not have access to your data, so we cannot delete it on your behalf
- Uninstalling the app will remove all stored data from your device

### International Data Transfers

Since all data is stored locally on your device, no international data transfers occur.

### Contact Us

If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:

**Email**: [Your Email Address]
**Address**: [Your Address]

### Compliance

This Privacy Policy complies with:
- General Data Protection Regulation (GDPR)
- California Consumer Privacy Act (CCPA)
- Google Play Store Privacy Policy requirements
- Apple App Store Privacy Policy requirements

### Consent

By using Lectur, you consent to the storage of your data locally on your device as described in this Privacy Policy. Since all data remains on your device and is not transmitted externally, your privacy is fully protected.

---

## License

[Specify your license here]

## Support

For support, feature requests, or bug reports, please contact us at [Your Email Address].

## Acknowledgments

- Built with [Expo](https://expo.dev)
- UI components inspired by modern design principles
- Icons and assets created for this project

---

**Note**: This app is designed for personal use by tutors and teachers. All data remains on your device and is never transmitted to external servers.
