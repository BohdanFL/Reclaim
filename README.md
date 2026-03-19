# 📱 Reclaim — Digital Well-being Mobile App

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)](https://developer.android.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white)](https://firebase.google.com/)

**Reclaim** is a powerful Android application built to help you take back control of your digital life. It tracks activity, manages screen time, and provides the tools needed to break the cycle of mindless scrolling and build healthier digital habits.

---

## Key Features

*   **Activity Monitoring**: Real-time tracking of app usage, total screen time, and device unlocks using Android System APIs.
*   **App Limits & Blocking**: Set daily time limits for specific apps. Uses Accessibility Services to automatically block access once limits are reached.
*   **Focus Mode**: Dedicated sessions with a built-in timer that restricts access to distracting apps, helping you stay productive.
*   **Gamification**: Stay motivated with daily "Digital Detox" challenges and a comprehensive achievement system.
*   **Smart Insights**: Get personalized tips and analysis based on your usage patterns to optimize your digital well-being.

---

## 🛠 Tech Stack

- **Core**: [React Native](https://reactnative.dev/) (JavaScript/TypeScript)
- **Backend**: [Firebase](https://firebase.google.com/) (Authentication & Realtime Database)
- **Local Storage**: [MMKV](https://github.com/mrousavy/react-native-mmkv) / SQLite for high-performance data persistence.
- **Android Integration**: 
  - `UsageStatsManager` for activity tracking.
  - `Accessibility Service` for advanced app blocking.

---

## 📂 Project Structure

```text
Reclaim/
├── assets/             # Images, fonts, and static resources
├── components/         # Reusable UI components (shadcn/ui inspired)
├── config/             # Configuration files and environment variables
├── constants/          # App constants, themes, and colors
├── contexts/           # React Context providers for state management
├── hooks/              # Custom React hooks
├── navigation/         # React Navigation setup
├── screens/            # Main application screens
├── services/           # External API and Firebase services
└── App.jsx             # Application entry point
```

---

## ⚙️ Getting Started

> [!NOTE]
> Ensure you have your [React Native Environment](https://reactnative.dev/docs/set-up-your-environment) set up properly before starting.

### 1. Clone & Install
```bash
git clone https://github.com/BohdanFL/Reclaim.git
cd Reclaim
npm install
```

### 2. Start Metro
```bash
npm start
```

### 3. Run on Android
```bash
npm run android
```

---

*Built with ❤️ for a healthier digital future.*
