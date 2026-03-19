import database from '@react-native-firebase/database';
import { getAuthToken } from './AuthService';

const FirebaseService = {
  async getFirebaseUserPath(userId) {
    if (!userId) {
      const token = await getAuthToken();
      if (!token || !token.uid) {
        console.error('FirebaseService: User ID is not available.');
        return null;
      }
      userId = token.uid;
    }
    return `/users/${userId}`;
  },

  writeData: async (path, data) => {
    try {
      await database().ref(path).set(data);
      return true;
    } catch (error) {
      console.error('FirebaseService: Error writing data:', error);
      throw error;
    }
  },

  readData: async (path) => {
    try {
      const snapshot = await database().ref(path).once('value');
      return snapshot.val();
    } catch (error) {
      console.error('FirebaseService: Error reading data:', error);
      throw error;
    }
  },

  updateData: async (path, data) => {
    try {
      await database().ref(path).update(data);
      return true;
    } catch (error) {
      console.error('FirebaseService: Error updating data:', error);
      throw error;
    }
  },

  deleteData: async (path) => {
    try {
      await database().ref(path).remove();
      return true;
    } catch (error) {
      console.error('FirebaseService: Error deleting data:', error);
      throw error;
    }
  },
};

export default FirebaseService; 