import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
const ACTIVE_SESSION_KEY = 'active_focus_session';

class FocusSessionManager {
  saveSession(sessionData) {
    try {
      storage.set(ACTIVE_SESSION_KEY, JSON.stringify({
        ...sessionData,
        startTime: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Error saving focus session:', error);
    }
  }

  getActiveSession() {
    try {
      const sessionData = storage.getString(ACTIVE_SESSION_KEY);
      if (!sessionData) return null;

      const session = JSON.parse(sessionData);
      const startTime = new Date(session.startTime);
      const currentTime = new Date();
      const elapsedMinutes = Math.floor((currentTime - startTime) / (1000 * 60));

      // Якщо сесія завершилась, видаляємо її
      if (elapsedMinutes >= session.duration) {
        this.clearSession();
        return null;
      }

      return {
        ...session,
        remainingMinutes: session.duration - elapsedMinutes,
      };
    } catch (error) {
      console.error('Error getting active session:', error);
      return null;
    }
  }

  clearSession() {
    try {
      storage.delete(ACTIVE_SESSION_KEY);
    } catch (error) {
      console.error('Error clearing focus session:', error);
    }
  }
}

export default new FocusSessionManager(); 