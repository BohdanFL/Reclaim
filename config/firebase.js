import firebase, { getApps } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

// Ініціалізація Firebase
const initializeFirebase = () => {
  if (getApps().length === 0) {
    firebase.initializeApp({
      // Firebase автоматично використовує конфігурацію з google-services.json
    });
  }
};

export { firebase, auth, database, initializeFirebase }; 